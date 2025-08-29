// templates.js - Clean algorithmic templates for LeetCode problems

const TEMPLATES = {
  "sliding-window": {
    name: "Sliding Window",
    description: "Two pointers technique for subarray/substring problems",
    category: "Array/String",
    difficulty: "Medium",
    code: `/**
 * Sliding Window Template
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
}

// Example: Minimum Size Subarray Sum
// while (currentSum >= target) {
//     result = Math.min(result, right - left + 1);
//     currentSum -= nums[left];
//     left++;
// }`,
    examples: [
      "Minimum Size Subarray Sum",
      "Longest Substring Without Repeating Characters",
      "Maximum Average Subarray I",
      "Subarray Sum Equals K",
    ],
    keywords: [
      "subarray",
      "substring",
      "window",
      "sum",
      "minimum",
      "maximum",
      "consecutive",
    ],
  },

  "two-pointers": {
    name: "Two Pointers",
    description: "Two pointers moving in different directions",
    category: "Array",
    difficulty: "Easy/Medium",
    code: `/**
 * Two Pointers Template
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
}

// Example: Two Sum II - Input Array Is Sorted
// if (sum === target) return [left + 1, right + 1];`,
    examples: [
      "Two Sum II - Input Array Is Sorted",
      "Container With Most Water",
      "3Sum",
      "Valid Palindrome",
    ],
    keywords: ["sorted", "two sum", "palindrome", "container", "water"],
  },

  "binary-search": {
    name: "Binary Search",
    description: "Search in sorted arrays or answer space",
    category: "Search",
    difficulty: "Medium",
    code: `/**
 * Binary Search Template
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
}

// For finding first occurrence:
// if (nums[mid] === target) {
//     result = mid;
//     right = mid - 1; // continue searching left
// }`,
    examples: [
      "Binary Search",
      "Search Insert Position",
      "Find First and Last Position of Element in Sorted Array",
      "Sqrt(x)",
    ],
    keywords: ["sorted", "search", "find", "position", "sqrt", "peak"],
  },

  dfs: {
    name: "Depth-First Search",
    description: "Recursive or iterative tree/graph traversal",
    category: "Tree/Graph",
    difficulty: "Medium",
    code: `/**
 * DFS Template (Recursive)
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
}

/**
 * DFS Template (Iterative with Stack)
 */
function dfsIterative(root) {
    if (!root) return [];
    
    let stack = [root];
    let visited = new Set();
    let result = [];
    
    while (stack.length > 0) {
        let node = stack.pop();
        
        if (!visited.has(node)) {
            visited.add(node);
            result.push(node.val);
            
            // Add children to stack (reverse order)
            for (let i = node.children.length - 1; i >= 0; i--) {
                stack.push(node.children[i]);
            }
        }
    }
    
    return result;
}`,
    examples: [
      "Binary Tree Inorder Traversal",
      "Number of Islands",
      "Clone Graph",
      "Word Search",
    ],
    keywords: [
      "tree",
      "graph",
      "island",
      "matrix",
      "traversal",
      "backtracking",
    ],
  },

  bfs: {
    name: "Breadth-First Search",
    description: "Level-by-level traversal using queue",
    category: "Tree/Graph",
    difficulty: "Medium",
    code: `/**
 * BFS Template
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
}

/**
 * BFS for Graphs
 */
function bfsGraph(startNode) {
    let queue = [startNode];
    let visited = new Set([startNode]);
    let result = [];
    
    while (queue.length > 0) {
        let node = queue.shift();
        result.push(node.val);
        
        for (let neighbor of node.neighbors) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    
    return result;
}`,
    examples: [
      "Binary Tree Level Order Traversal",
      "Word Ladder",
      "Number of Islands",
      "Shortest Path in Binary Matrix",
    ],
    keywords: ["level", "breadth", "shortest", "path", "queue", "hierarchy"],
  },

  dp: {
    name: "Dynamic Programming",
    description: "Memoization and tabulation for optimization",
    category: "Dynamic Programming",
    difficulty: "Medium/Hard",
    code: `/**
 * DP Template (Top-down with Memoization)
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
}

/**
 * DP Template (Bottom-up with Tabulation)
 */
function dpBottomUp(n) {
    if (n <= 1) return n;
    
    let dp = new Array(n + 1);
    dp[0] = 0;
    dp[1] = 1;
    
    for (let i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    
    return dp[n];
}

/**
 * DP with Space Optimization
 */
function dpOptimized(n) {
    if (n <= 1) return n;
    
    let prev = 0, curr = 1;
    
    for (let i = 2; i <= n; i++) {
        let next = prev + curr;
        prev = curr;
        curr = next;
    }
    
    return curr;
}`,
    examples: [
      "Fibonacci Number",
      "Climbing Stairs",
      "House Robber",
      "Longest Increasing Subsequence",
    ],
    keywords: [
      "optimization",
      "memoization",
      "tabulation",
      "fibonacci",
      "robber",
    ],
  },
};

// Template categories for organization
const TEMPLATE_CATEGORIES = {
  "Array/String": ["sliding-window", "two-pointers"],
  Search: ["binary-search"],
  "Tree/Graph": ["dfs", "bfs"],
  "Dynamic Programming": ["dp"],
};

// Export for use in content script
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TEMPLATES, TEMPLATE_CATEGORIES };
}
