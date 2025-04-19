def find_last_boxed(text):
    """
    Find the content of the last \boxed{} command in the text.
    
    Args:
        text (str): The text to search in
        
    Returns:
        str: The content inside the last \boxed{}, or None if no \boxed{} is found
    """
    last_start = text.rfind("\\boxed{")
    if last_start == -1:
        return None
        
    # Find matching closing brace
    brace_count = 1
    content_start = last_start + 7  # Length of "\boxed{"
    
    for i in range(content_start, len(text)):
        if text[i] == "{":
            brace_count += 1
        elif text[i] == "}":
            brace_count -= 1
            if brace_count == 0:
                return text[content_start:i]
                
    return None  # Unmatched braces

def find_string_between(left, right, input):
    return input[input.rfind(left)+len(left):input.rfind(right)]

def extract_reasoning(text):
    """
    Extract the reasoning from the text.
    
    Args:
        text (str): The text to search in
    """
    start = text.find("<think>")
    if start == -1:
        return None
        
    end = text.find("</think>")
    altend = text.find("<｜end▁of▁thinking｜>")
    if end == -1 and altend == -1:
        return None
    
    if end == -1:
        end = altend
        
    # Add length of opening tag to get content start
    content_start = start + len("<think>")
    
    return text[content_start:end]

def hide(text):
    """
    Convert any non-whitespace characters to dots, preserving whitespace and newlines.
    
    Args:
        text (str): The text to convert
        
    Returns:
        str: The text with non-whitespace characters replaced with dots, keeping whitespace
    """
    result = []
    for c in text:
        if c.isspace() or c == '\n':
            result.append(c)
        else:
            result.append('.')
    return ''.join(result)