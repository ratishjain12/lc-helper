"""
Sliding Window Template - Python

Use for: subarray sum, substring problems, fixed/variable window size
Time: O(n), Space: O(1)

Examples:
- Minimum Size Subarray Sum
- Longest Substring Without Repeating Characters
- Maximum Average Subarray I
- Subarray Sum Equals K
"""

def sliding_window(nums, target):
    left = 0
    right = 0
    current_sum = 0
    result = 0
    
    while right < len(nums):
        # Expand window
        current_sum += nums[right]
        
        # Shrink window when condition is met
        while current_sum >= target:
            # Update result
            result = min(result, right - left + 1)
            
            # Remove left element
            current_sum -= nums[left]
            left += 1
        
        right += 1
    
    return result


def fixed_size_window(nums, k):
    current_sum = 0
    
    # Calculate sum of first window
    for i in range(k):
        current_sum += nums[i]
    
    result = current_sum
    
    # Slide window
    for i in range(k, len(nums)):
        current_sum = current_sum - nums[i - k] + nums[i]
        result = max(result, current_sum)
    
    return result


def variable_size_window(nums, target):
    left = 0
    current_sum = 0
    min_length = float('inf')
    
    for right in range(len(nums)):
        current_sum += nums[right]
        
        while current_sum >= target:
            min_length = min(min_length, right - left + 1)
            current_sum -= nums[left]
            left += 1
    
    return 0 if min_length == float('inf') else min_length


def longest_substring_without_repeating(s):
    char_set = set()
    left = 0
    max_length = 0
    
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
    
    return max_length
