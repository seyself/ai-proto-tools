/**
 * Asynchronous function to generate a commit message.
 * This function automatically creates an appropriate commit message based on current changes.
 * Specifically, it executes the `git diff` command to get file differences,
 * passes them to AI, and generates a commit message.
 * The generated message is returned in a format that can be used with the `git commit -m` command.
 *
 * @returns {Promise<string>} The generated commit message string.
 * @throws {Error} Throws an error if there's no response from AI or if commit message generation fails.
 * @remarks This function assists in automating commit message generation in version control.
 *          If the response fails, developers need to create commit messages manually.
 */
export declare function generateCommitMessage(): Promise<string>;
/**
 * Function to commit changes.
 * This function generates a commit message based on current changes and commits the changes to Git.
 * Specifically, it first calls the "generateCommitMessage" function to get the commit message,
 * then uses the obtained message to generate a Git commit command,
 * and finally executes the commit command.
 *
 * @returns {Promise<void>} This function does not return a value and runs asynchronously.
 * @throws {Error} Throws an error if there's an error generating the commit message or committing the changes.
 * @remarks This function is important for recording change history and understanding Git history.
 *          Callers can use this function to manage Git changes.
 */
export declare function commit(): Promise<void>;
/**
 * Function to push local changes to the remote repository.
 * This function pushes local changes to the remote repository,
 * allowing other developers to see the changes.
 *
 * @returns {void} This function does not return a value and runs synchronously.
 * @throws {Error} Throws an error if there's an error pushing the changes.
 */
export declare function push(): void;
/**
 * Function to discard changes and revert to the latest commit state.
 * This function discards all uncommitted changes and untracked files,
 * and reverts the working directory to the latest commit state.
 *
 * @returns {void} This function does not return a value and runs synchronously.
 * @throws {Error} Throws an error if there's an error discarding changes.
 */
export declare function discardChanges(): void;
/**
 * Function to switch to a specified branch.
 * This function switches to a specified branch if it exists,
 * or creates a new branch and switches to it if it doesn't exist.
 *
 * @param {string} branchName - The name of the branch to switch to or create.
 * @returns {void} This function does not return a value and runs synchronously.
 * @throws {Error} Throws an error if there's an error switching branches.
 */
export declare function switchBranch(branchName: string): void;
/**
 * Function to get the current Git branch name.
 * This function gets the current branch name of the working directory.
 * If the branch name cannot be retrieved, it throws an error.
 *
 * @returns {string} The current branch name.
 * @throws {Error} Throws an error if the current branch name cannot be retrieved.
 */
export declare function getCurrentBranchName(): string;
/**
 * Function to merge a specified branch into the current branch.
 * This function merges a specified branch into the current branch.
 * If the specified branch does not exist or the current branch does not exist,
 * an error message is displayed.
 *
 * @param {string} fromBranch - The name of the branch to merge from (default is 'main').
 * @returns {void} This function does not return a value and runs synchronously.
 * @throws {Error} Throws an error if there's an error merging branches.
 */
export declare function mergeBranch(fromBranch: string, toBranch?: string): void;
/**
 * Function to get a list of changed files and their differences.
 * This function gets a list of changed files and their differences in the current Git repository.
 * The list is returned in an array format, where each element is an object containing the file path,
 * file name, and difference content.
 *
 * @returns {any[]} An array of objects containing information about changed files.
 * @throws {Error} Throws an error if there's an error getting the list of changed files.
 *    If an error occurs, the reason is printed to the console.
 */
export declare function diff(): any[];
/**
 * gitTest function is an asynchronous function to test Git operations.
 * This function uses commented-out code to demonstrate various Git operations.
 * It also retrieves information about file differences and displays it in JSON format.
 *
 * @returns {Promise<void>} This function does not return a value and runs asynchronously.
 * @remarks This function demonstrates the use of various Git operations,
 *          such as commit processing, branch switching, and merging.
 *          It allows developers to check the state of branches and understand changes.
 */
export declare function gitTest(): Promise<void>;
//# sourceMappingURL=index.d.ts.map