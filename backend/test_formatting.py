#!/usr/bin/env python3
"""
Test script for the new format_response function
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))

from chatbot import format_response

def test_format_response():
    """Test the format_response function with various inputs"""
    
    # Test 1: Duplicate headings
    test_input_1 = """
# 7-Day Personalized Diet Plan

## Patient Summary
Some content here.

## Patient Summary
Duplicate content here.

## Daily Meal Structure
More content.
"""
    
    print("Test 1: Duplicate headings")
    print("Input:")
    print(test_input_1)
    print("\nOutput:")
    result_1 = format_response(test_input_1)
    print(result_1)
    print("\n" + "="*50 + "\n")
    
    # Test 2: Triple asterisks
    test_input_2 = """
## Important Information
This is ***very important*** information.
Some ***other*** important details.
"""
    
    print("Test 2: Triple asterisks")
    print("Input:")
    print(test_input_2)
    print("\nOutput:")
    result_2 = format_response(test_input_2)
    print(result_2)
    print("\n" + "="*50 + "\n")
    
    # Test 3: Inconsistent heading levels
    test_input_3 = """
# Main Title
## Section 1
### Subsection 1.1
#### Sub-subsection 1.1.1
# Another Main Title
### Another Subsection
"""
    
    print("Test 3: Inconsistent heading levels")
    print("Input:")
    print(test_input_3)
    print("\nOutput:")
    result_3 = format_response(test_input_3)
    print(result_3)
    print("\n" + "="*50 + "\n")
    
    # Test 4: Mixed bullet points
    test_input_4 = """
## List Examples
• First bullet point
- Second bullet point
* Third bullet point
1. Numbered item
2. Another numbered item
"""
    
    print("Test 4: Mixed bullet points")
    print("Input:")
    print(test_input_4)
    print("\nOutput:")
    result_4 = format_response(test_input_4)
    print(result_4)
    print("\n" + "="*50 + "\n")
    
    # Test 5: Excessive whitespace
    test_input_5 = """
# Title


## Section


### Subsection


Content here.
"""
    
    print("Test 5: Excessive whitespace")
    print("Input:")
    print(test_input_5)
    print("\nOutput:")
    result_5 = format_response(test_input_5)
    print(result_5)
    print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    test_format_response()
