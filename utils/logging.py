import random
import sys
import itertools
import json
import os # Import the os module
# ANSI escape codes for colors
COLORS = {
    "black": "\033[30m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "white": "\033[37m",
    "reset": "\033[0m",
}

COLOR_NAMES = list(COLORS.keys())
COLOR_NAMES.remove("reset") # Don't pick reset as a random color

# Generator to cycle through colors
_color_cycler = itertools.cycle(COLOR_NAMES)

def cprint(*args, color: str | None = None, **kwargs):
    """
    Prints the given arguments with the specified color. If no color is provided,
    it cycles through a predefined list of colors for subsequent calls.

    Args:
        *args: Objects to print, same as the built-in print function.
        color: The name of the color to use (e.g., "red", "green").
               If None, the next color in the cycle is chosen.
        **kwargs: Additional keyword arguments for the built-in print function
                  (e.g., sep, end, file, flush).

    Returns:
        The name of the color used for printing.
    """
    if color is None:
        # Get the next color from the cycle
        chosen_color_name = next(_color_cycler)
        color_code = COLORS[chosen_color_name]
    elif color in COLORS:
        color_code = COLORS[color]
        chosen_color_name = color # Keep track of the chosen color name
    else:
        # Fallback if an invalid color name is provided, still use the cycle
        print(f"Warning: Invalid color '{color}'. Using next color in cycle.", file=sys.stderr)
        chosen_color_name = next(_color_cycler)
        color_code = COLORS[chosen_color_name]

    # Get the standard print arguments, excluding our custom 'color' arg
    print_kwargs = {k: v for k, v in kwargs.items()}

    # Construct the output string
    sep = print_kwargs.get("sep", " ")
    output_string = sep.join(map(str, args))

    # Apply color and print
    print(f"{color_code}{output_string}{COLORS['reset']}", **print_kwargs)

    # Return the name of the color that was actually used
    return chosen_color_name

def pretty_json(obj):
    return json.dumps(obj, indent=4)

def save_data(obj, prefix: str):
    """
    Saves the given object as a pretty-printed JSON file in the 'cache' directory.

    Args:
        obj: The Python object to serialize and save.
        prefix: The prefix for the filename (e.g., 'my_data'). The file will be
                saved as 'cache/{prefix}.json'.

    Returns:
        The full path to the saved file.
    """
    cache_dir = ".cache"
    # Ensure the cache directory exists
    os.makedirs(cache_dir, exist_ok=True)

    # Construct the full file path
    file_path = os.path.join(cache_dir, f"{prefix}.json")

    # Write the object to the file as JSON
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(obj, f, indent=4, ensure_ascii=False)
        print(f"Data saved to {file_path}")
        return file_path
    except (IOError, TypeError) as e:
        print(f"Error saving data to {file_path}: {e}", file=sys.stderr)
        return None
