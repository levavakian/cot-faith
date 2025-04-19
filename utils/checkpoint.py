import pickle
import json
import base64
import sys
import argparse
from filelock import FileLock
import os
import fnmatch # Import fnmatch for wildcard matching

class Checkpointer:
    def __init__(self, filename, enabled=True):
        self.filename = filename
        self.lock_filename = filename + ".lock"
        self.enabled = enabled

    def _get_key(self, hashable):
        # Ensure hashable is stringified before encoding
        hashable_str = str(hashable)
        return str(base64.b64encode(hashable_str.encode()).decode('utf-8'))
    
    def clear(self, pattern: str):
        """
        Clears checkpoint entries where the original hashable's string representation
        matches the given pattern (supports Unix shell-style wildcards like *).

        Args:
            pattern: The string pattern to match against the original hashable's str().
        """
        lock = FileLock(self.lock_filename, timeout=30)
        cleared_count = 0
        original_keys_cleared = [] # Store original string representations for reporting

        with lock:
            try:
                with open(self.filename, 'r') as f:
                    checkpoints = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                checkpoints = {} # No file or invalid JSON, nothing to clear

            keys_to_delete = []
            for key in checkpoints.keys():
                try:
                    # Decode the base64 key back to the original string representation
                    original_str = base64.b64decode(key.encode()).decode('utf-8')
                    # Check if the original string matches the pattern
                    if fnmatch.fnmatch(original_str, pattern):
                        keys_to_delete.append(key)
                        original_keys_cleared.append(original_str) # Keep for logging
                except (base64.binascii.Error, UnicodeDecodeError):
                    # Handle cases where a key might not be valid base64/utf-8
                    print(f"Warning: Could not decode key '{key}'. Skipping.", file=sys.stderr)
                    continue

            if keys_to_delete:
                for key in keys_to_delete:
                    del checkpoints[key]
                    cleared_count += 1

                # Save the modified checkpoints
                with open(self.filename, 'w') as f:
                    json.dump(checkpoints, f, indent=4)

        if cleared_count > 0:
            print(f"Cleared {cleared_count} checkpoint(s) matching pattern '{pattern}' from {self.filename}:")
            # Optionally print the specific keys cleared, might be too verbose if many
            for orig_key in original_keys_cleared:
                print(f"  - {orig_key}")
        else:
            print(f"No checkpoints found matching pattern '{pattern}' in {self.filename}")
    
    def mark(self, func, hashable, name="checkpoint", force=False):
        """
        Mark a checkpoint for a function with a specific hashable input.
        
        Args:
            func: The function being checkpointed
            hashable: A hashable input to the function
            name: A name for this checkpoint
        """
        if not self.enabled:
            return func()

        # Load existing checkpoints or create empty dict if file doesn't exist
        key = self._get_key(hashable)

        checkpoints = {}
        if not force:
            # Use lock for reading as well to prevent race conditions if another process is clearing/writing
            read_lock = FileLock(self.lock_filename, timeout=10)
            with read_lock:
                try:
                    with open(self.filename, 'r') as f:
                        checkpoints = json.load(f)
                        if key in checkpoints:
                            obj = pickle.loads(base64.b64decode(checkpoints[key]))
                            if name:
                                print(f"Loading {name} (key: {str(hashable)[:50]}...) from {self.filename}")
                            return obj
                except (FileNotFoundError, json.JSONDecodeError):
                    pass # File not found or empty/invalid JSON, proceed to compute
                except Exception as e:
                     print(f"Error loading checkpoint {name} (key: {str(hashable)[:50]}...): {e}", file=sys.stderr)

        # If checkpoint not found or force=True, execute the function
        result = func()

        # Prepare data for saving
        try:
            pickled = pickle.dumps(result)
            data = str(base64.b64encode(pickled).decode('utf-8'))
        except (pickle.PicklingError, TypeError) as e:
            print(f"Error: Could not pickle result for checkpoint '{name}' (key: {str(hashable)[:50]}...). Checkpoint not saved. Error: {e}", file=sys.stderr)
            return result # Return the result even if saving fails

        # Acquire write lock and save
        write_lock = FileLock(self.lock_filename, timeout=30) # Use separate lock instance potentially
        with write_lock:
            # Re-read checkpoints inside the lock to avoid overwriting concurrent changes
            try:
                with open(self.filename, 'r') as f:
                    checkpoints = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                checkpoints = {} # Start fresh if file missing or corrupt

            # Save the new checkpoint data
            checkpoints[key] = data
            try:
                with open(self.filename, 'w') as f:
                    json.dump(checkpoints, f, indent=4)
                if name:
                   print(f"New checkpoint {name} (key: {str(hashable)[:50]}...) saved to {self.filename}")
            except IOError as e:
                 print(f"Error writing checkpoint file {self.filename}: {e}", file=sys.stderr)

        return result
    
    def add_checkpoint_clear_args(self, parser: argparse.ArgumentParser):
        """Adds checkpoint clearing arguments to an existing ArgumentParser."""
        group = parser.add_argument_group('Checkpoint Clearing Options')
        group.add_argument(
            "--clr",
            help="The key pattern (as text, supporting wildcards like *) to clear from the checkpoint file. If used, the script will clear matching keys and exit."
        )
        group.add_argument(
            "--del",
            action='store_true',
            help="Delete the entire checkpoint file. If used, the script will delete the file and exit. Takes precedence over --clr."
        )
    
    def handle_checkpoint_clear_args(self, args: argparse.Namespace):
        """
        Checks parsed arguments and performs checkpoint clearing or deletion if requested.
        Exits the script after clearing or deleting.

        Args:
            args: The Namespace object returned by parser.parse_args().
        """
        # Check if deletion is requested
        delete_requested = hasattr(args, 'del') and getattr(args, 'del')

        if delete_requested:
            print(f"Deleting checkpoint file: {self.filename}")
            try:
                os.remove(self.filename)
                print(f"Deleted {self.filename}")
            except FileNotFoundError:
                print(f"File not found: {self.filename}")
            except OSError as e:
                print(f"Error deleting {self.filename}: {e}", file=sys.stderr)

            # Also attempt to remove the lock file if it exists
            print(f"Attempting to delete lock file: {self.lock_filename}")
            try:
                os.remove(self.lock_filename)
                print(f"Deleted {self.lock_filename}")
            except FileNotFoundError:
                print(f"Lock file not found: {self.lock_filename}")
            except OSError as e:
                print(f"Error deleting lock file {self.lock_filename}: {e}", file=sys.stderr)
            sys.exit() # Exit after deletion attempt

        # Check if clear action is requested (only if deletion wasn't requested)
        clear_pattern_requested = hasattr(args, 'clr') and args.clr is not None

        if clear_pattern_requested:
            # Use the updated clear method with wildcard support
            self.clear(args.clr)
            sys.exit() # Exit after clearing attempt

        # If neither --del nor --clr was specified and handled, just return
