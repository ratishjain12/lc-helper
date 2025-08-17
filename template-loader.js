// template-loader.js - Loads templates from folder structure

const TEMPLATE_LANGUAGES = {
  javascript: {
    name: "JavaScript",
    extension: ".js",
    commentStyle: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  },
  python: {
    name: "Python", 
    extension: ".py",
    commentStyle: "#",
    blockCommentStart: '"""',
    blockCommentEnd: '"""'
  },
  java: {
    name: "Java",
    extension: ".java", 
    commentStyle: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  },
  cpp: {
    name: "C++",
    extension: ".cpp",
    commentStyle: "//", 
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  },
  csharp: {
    name: "C#",
    extension: ".cs",
    commentStyle: "//",
    blockCommentStart: "/*", 
    blockCommentEnd: "*/"
  },
  go: {
    name: "Go",
    extension: ".go",
    commentStyle: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  },
  rust: {
    name: "Rust", 
    extension: ".rs",
    commentStyle: "//",
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  }
};

const TEMPLATE_PATTERNS = {
  "sliding-window": {
    name: "Sliding Window",
    description: "Two pointers technique for subarray/substring problems",
    category: "Array/String",
    difficulty: "Medium",
    keywords: ["subarray", "substring", "window", "sum", "minimum", "maximum", "consecutive"]
  },
  "two-pointers": {
    name: "Two Pointers", 
    description: "Two pointers moving in different directions",
    category: "Array",
    difficulty: "Easy/Medium",
    keywords: ["sorted", "two sum", "palindrome", "container", "water"]
  },
  "binary-search": {
    name: "Binary Search",
    description: "Search in sorted arrays or answer space", 
    category: "Search",
    difficulty: "Medium",
    keywords: ["sorted", "search", "find", "position", "sqrt", "peak"]
  },
  "dfs": {
    name: "Depth-First Search",
    description: "Recursive or iterative tree/graph traversal",
    category: "Tree/Graph", 
    difficulty: "Medium",
    keywords: ["tree", "graph", "island", "matrix", "traversal", "backtracking"]
  },
  "bfs": {
    name: "Breadth-First Search",
    description: "Level-by-level traversal using queue",
    category: "Tree/Graph",
    difficulty: "Medium", 
    keywords: ["level", "breadth", "shortest", "path", "queue", "hierarchy"]
  },
  "dp": {
    name: "Dynamic Programming",
    description: "Memoization and tabulation for optimization",
    category: "Dynamic Programming",
    difficulty: "Medium/Hard",
    keywords: ["optimization", "memoization", "tabulation", "fibonacci", "robber"]
  }
};

// Template categories for organization
const TEMPLATE_CATEGORIES = {
  "Array/String": ["sliding-window", "two-pointers"],
  "Search": ["binary-search"],
  "Tree/Graph": ["dfs", "bfs"], 
  "Dynamic Programming": ["dp"]
};

// Load template content from file system (simulated for now)
// In a real implementation, this would fetch from the actual files
function loadTemplateContent(language, pattern) {
  // For now, return the content from our existing templates
  // In a real implementation, this would read from templates/{language}/{pattern}.{ext}
  
  const templates = {
    javascript: {
      "sliding-window": `/**
 * Sliding Window Template - JavaScript
 * 
 * Use for: subarray sum, substring problems, fixed/variable window size
 * Time: O(n), Space: O(1)
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
}`,
      "two-pointers": `/**
 * Two Pointers Template - JavaScript
 * 
 * Use for: sorted arrays, palindrome, container problems
 * Time: O(n), Space: O(1)
 */

function twoPointers(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    
    while (left < right) {
        let sum = nums[left] + nums[right];
        
        if (sum === target) {
            return [left, right];
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }
    
    return [-1, -1];
}`,
      "binary-search": `/**
 * Binary Search Template - JavaScript
 * 
 * Use for: sorted arrays, finding position, optimization problems
 * Time: O(log n), Space: O(1)
 */

function binarySearch(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    
    while (left <= right) {
        let mid = left + Math.floor((right - left) / 2);
        
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}`,
      "dfs": `/**
 * DFS Template - JavaScript
 * 
 * Use for: tree traversal, graph exploration, backtracking
 * Time: O(V + E), Space: O(H) where H is height/depth
 */

function dfs(node, visited = new Set()) {
    // Base case
    if (!node || visited.has(node)) {
        return;
    }
    
    // Mark as visited
    visited.add(node);
    
    // Process current node
    console.log(node.val);
    
    // Explore neighbors
    for (let neighbor of node.neighbors) {
        dfs(neighbor, visited);
    }
}`,
      "bfs": `/**
 * BFS Template - JavaScript
 * 
 * Use for: level order traversal, shortest path, graph exploration
 * Time: O(V + E), Space: O(W) where W is max width
 */

function bfs(root) {
    if (!root) return [];
    
    let queue = [root];
    let result = [];
    
    while (queue.length > 0) {
        let levelSize = queue.length;
        let currentLevel = [];
        
        for (let i = 0; i < levelSize; i++) {
            let node = queue.shift();
            currentLevel.push(node.val);
            
            // Add children to queue
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }
        
        result.push(currentLevel);
    }
    
    return result;
}`,
      "dp": `/**
 * DP Template - JavaScript
 * 
 * Use for: optimization problems, overlapping subproblems
 * Time: O(n), Space: O(n)
 */

function dpTopDown(n, memo = {}) {
    // Base cases
    if (n <= 1) return n;
    
    // Check memo
    if (memo[n] !== undefined) {
        return memo[n];
    }
    
    // Recursive case
    memo[n] = dpTopDown(n - 1, memo) + dpTopDown(n - 2, memo);
    return memo[n];
}`
    },
    python: {
      "sliding-window": `"""
Sliding Window Template - Python

Use for: subarray sum, substring problems, fixed/variable window size
Time: O(n), Space: O(1)
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
    
    return result`,
      "two-pointers": `"""
Two Pointers Template - Python

Use for: sorted arrays, palindrome, container problems
Time: O(n), Space: O(1)
"""

def two_pointers(nums, target):
    left = 0
    right = len(nums) - 1
    
    while left < right:
        sum_val = nums[left] + nums[right]
        
        if sum_val == target:
            return [left, right]
        elif sum_val < target:
            left += 1
        else:
            right -= 1
    
    return [-1, -1]`,
      "binary-search": `"""
Binary Search Template - Python

Use for: sorted arrays, finding position, optimization problems
Time Complexity: O(log n)
Space Complexity: O(1)
"""

def binary_search(nums, target):
    """
    Basic Binary Search Template
    """
    left = 0
    right = len(nums) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`,
      "dfs": `"""
DFS Template - Python

Use for: tree traversal, graph exploration, backtracking
Time Complexity: O(V + E)
Space Complexity: O(H) where H is height/depth
"""

def dfs(node, visited=None):
    """
    Basic DFS Template
    """
    if visited is None:
        visited = set()
    
    # Base case
    if not node or node in visited:
        return
    
    # Mark as visited
    visited.add(node)
    
    # Process current node
    print(node.val)
    
    # Explore neighbors
    for neighbor in node.neighbors:
        dfs(neighbor, visited)`,
      "bfs": `"""
BFS Template - Python

Use for: level order traversal, shortest path, graph exploration
Time Complexity: O(V + E)
Space Complexity: O(W) where W is max width
"""

from collections import deque

def bfs(root):
    """
    Basic BFS Template
    """
    if not root:
        return []
    
    queue = deque([root])
    result = []
    
    while queue:
        level_size = len(queue)
        current_level = []
        
        for _ in range(level_size):
            node = queue.popleft()
            current_level.append(node.val)
            
            # Add children to queue
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        
        result.append(current_level)
    
    return result`,
      "dp": `"""
DP Template - Python

Use for: optimization problems, overlapping subproblems
Time Complexity: O(n)
Space Complexity: O(n)
"""

def dp_top_down(n, memo=None):
    """
    DP Template with Memoization
    """
    if memo is None:
        memo = {}
    
    # Base cases
    if n <= 1:
        return n
    
    # Check memo
    if n in memo:
        return memo[n]
    
    # Recursive case
    memo[n] = dp_top_down(n - 1, memo) + dp_top_down(n - 2, memo)
    return memo[n]`
    }
  };
  
  return templates[language]?.[pattern] || "Template not available for this language/pattern combination.";
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    TEMPLATE_LANGUAGES, 
    TEMPLATE_PATTERNS, 
    TEMPLATE_CATEGORIES,
    loadTemplateContent 
  };
}
