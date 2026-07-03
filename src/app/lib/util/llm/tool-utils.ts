export function parseToolCallValue(
  toolName: string,
  args: Record<string, unknown>,
): string  {
  switch (toolName) {
    case "create_file":
      return (args.file_path as string)
    case "delete_file": {
      return (args.file_path as string)
    }
    case "read_file": {
      const filePath = (args.file_path as string)
      const startLine = args.start_line as number | undefined;
      const endLine = args.end_line as number | undefined;
      const aroundLine = args.around_line as number | undefined;

      if (startLine && endLine) {
        return `${filePath} (lines ${startLine}-${endLine})`;
      } else if (aroundLine) {
        return `${filePath} (around line ${aroundLine})`;
      } else if (startLine) {
        return `${filePath} (from line ${startLine})`;
      }
      return filePath;
    }
	case "file_exists": {
		const filePath = (args.file_path as string)
		return filePath;
	  }
    case "edit_file": {
      const filePath = (args.file_path as string)
      const lineNumber = args.line_number as number | undefined;
      const startLine = args.start_line as number | undefined;
      const endLine = args.end_line as number | undefined;
      const insertAtLine = args.insert_at_line as number | undefined;
      const appendAfterLine = args.append_after_line as number | undefined;

      if (lineNumber) {
        return `${filePath} (line ${lineNumber})`;
      } else if (startLine && endLine) {
        return `${filePath} (lines ${startLine}-${endLine})`;
      } else if (insertAtLine) {
        return `${filePath} (insert at line ${insertAtLine})`;
      } else if (appendAfterLine) {
        return `${filePath} (append after line ${appendAfterLine})`;
      }
      return filePath;
    }
    case "enhanced_edit_file": {
      const filePath = (args.file_path as string)
      const lineNumber = args.line_number as number | undefined;
      const startLine = args.start_line as number | undefined;
      const endLine = args.end_line as number | undefined;
      const insertAtLine = args.insert_at_line as number | undefined;
      const appendAfterLine = args.append_after_line as number | undefined;

      if (lineNumber) {
        return `${filePath} (line ${lineNumber})`;
      } else if (startLine && endLine) {
        return `${filePath} (lines ${startLine}-${endLine})`;
      } else if (insertAtLine) {
        return `${filePath} (insert at line ${insertAtLine})`;
      } else if (appendAfterLine) {
        return `${filePath} (append after line ${appendAfterLine})`;
      }
      return filePath;
    }
    case "search_files": {
      const pattern = args.pattern as string | undefined;
      const name = args.name as string | undefined;
      const extension = args.extension as string | undefined;
      const directory = args.directory as string | undefined;

      const searchTerms = [];
      if (pattern) searchTerms.push(`pattern: ${pattern}`);
      if (name) searchTerms.push(`name: ${name}`);
      if (extension) searchTerms.push(`ext: ${extension}`);
      if (directory) searchTerms.push(`in: ${directory}`);

      return searchTerms.length > 0 ? searchTerms.join(", ") : "files";
    }
    case "search_content": {
      const query = args.query as string | undefined;
      const filePattern = args.file_pattern as string | undefined;
      const directory = args.directory as string | undefined;

      const searchText = query || "content";
      const filters = [];
      if (filePattern) filters.push(`files: ${filePattern}`);
      if (directory) filters.push(`in: ${directory}`);

      return filters.length > 0 ? `${searchText} (${filters.join(", ")})` : searchText;
    }
    case "search_symbols": {
      const symbolName = args.symbol_name as string | undefined;
      const symbolType = args.symbol_type as string | undefined;
      const language = args.language as string | undefined;

      const searchText = symbolName || "symbols";
      const filters = [];
      if (symbolType && symbolType !== "any") filters.push(`type: ${symbolType}`);
      if (language) filters.push(`lang: ${language}`);

      return filters.length > 0 ? `${searchText} (${filters.join(", ")})` : searchText;
    }
    case "progress_update":
    case "request_user_input":
      return ((args.update || args.question) as string)
    case "final_answer":
        return (args.summary as string)
    case "install_dependencies": {
      const runnableDeps = args.dependencies as string[] | undefined;
      const devDeps = args.dependencies as string[] | undefined;
      const allDeps = [...(runnableDeps ?? []), ...(devDeps ?? [])];
	  
      return allDeps.join(", ")
    }
    case "search_codebase":
      return (args.query as string)
    case "get_files": {
      const directory = (args.directory as string)
      return directory === "" ? "root" : directory;
    }
    case "get_project_structure":
      return (args.depth as string)
	case "check_integration":
		return (args.service_name as string)
    case "create_supabase_migration":
      return (args.migration_name as string)
    case "edit_supabase_migration":
      return (args.migration_name as string)
    case "error":
      return (args.message as string) || "An error occurred";
    case "compile_code":
      return "Project compilation";
	
    default:
      return JSON.stringify(args);
  }
}
