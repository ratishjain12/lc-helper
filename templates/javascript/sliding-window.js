/**
 * Sliding Window Template - JavaScript
 * 
 * Use for: subarray sum, substring problems, fixed/variable window size
 * Time: O(n), Space: O(1)
 * 
 * Examples:
 * - Minimum Size Subarray Sum
 * - Longest Substring Without Repeating Characters
 * - Maximum Average Subarray I
 * - Subarray Sum Equals K
 */

function slidingWindow(nums, target) {
    let left = 0;
    let right = 0;
    let currentSum = 0;
    let result = 0;
    
    while (right < nums.length) {
        // Expand window
        currentSum += nums[right];
        
        // Shrink window when condition is met
        while (currentSum >= target) {
            // Update result
            result = Math.min(result, right - left + 1);
            
            // Remove left element
            currentSum -= nums[left];
            left++;
        }
        
        right++;
    }
    
    return result;
}

function fixedSizeWindow(nums, k) {
    let currentSum = 0;
    
    // Calculate sum of first window
    for (let i = 0; i < k; i++) {
        currentSum += nums[i];
    }
    
    let result = currentSum;
    
    // Slide window
    for (let i = k; i < nums.length; i++) {
        currentSum = currentSum - nums[i - k] + nums[i];
        result = Math.max(result, currentSum);
    }
    
    return result;
}

function variableSizeWindow(nums, target) {
    let left = 0;
    let currentSum = 0;
    let minLength = Infinity;
    
    for (let right = 0; right < nums.length; right++) {
        currentSum += nums[right];
        
        while (currentSum >= target) {
            minLength = Math.min(minLength, right - left + 1);
            currentSum -= nums[left];
            left++;
        }
    }
    
    return minLength === Infinity ? 0 : minLength;
}
