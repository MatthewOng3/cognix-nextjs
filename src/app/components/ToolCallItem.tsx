import { motion } from "framer-motion";
import {
  CheckCircle,
  Code2,
  Database,
  Edit,
  File,
  FilePlus,
  FileSearch,
  FileWarning,
  Folder,
  Package,
  Search,
  FolderTree,
  Workflow,
  FileQuestionIcon,
  Settings,
  Trash,
  Loader2,
} from "lucide-react";
import type { ToolCallComponent } from "@/app/lib/util/supabase/types/tables";

interface ToolCallItemProps {
  toolCall: ToolCallComponent;
  isAnimated?: boolean;
  delay?: number;
}

export function ToolCallItem({
  toolCall,
  isAnimated = false,
  delay = 0,
}: ToolCallItemProps) {
  const { name, result } = toolCall;

  const getIconAndText = () => {
    switch (name) {
      case "create_file":
        return {
          icon: <FilePlus className="w-4 h-4 text-green-500" />,
          text: `Created: ${result}`,
          color: "text-green-500",
        };
      case "edit_file":
      case "enhanced_edit_file":
        return {
          icon: <Edit className="w-4 h-4 text-blue-500" />,
          text: `Edited: ${result}`,
          color: "text-blue-500",
        };
      case "delete_file":
        return {
          icon: <Trash className="w-4 h-4 text-red-500" />,
          text: `Deleted: ${result}`,
          color: "text-red-500",
        };
	case "read_file":
		return {
			icon: <File className="w-4 h-4 text-gray-500" />,
			text: `Read file: ${result}`,
			color: "text-gray-500",
		};
	case "file_exists":
		return {
			icon: <FileQuestionIcon className="w-4 h-4 text-gray-500" />,
			text: `Checked if file exists: ${result}`,
			color: "text-gray-500",
		};
      case "get_files":
        return {
          icon: <Folder className="w-4 h-4 text-yellow-500" />,
          text: `Read directory: ${result === "" ? "root" : result}`,
          color: "text-yellow-500",
        };
      case "search_codebase":
        return {
          icon: <Search className="w-4 h-4 text-purple-500" />,
          text: `Searched: ${result}`,
          color: "text-purple-500",
        };
      case "search_files":
        return {
          icon: <FileSearch className="w-4 h-4 text-blue-400" />,
          text: `Searched for: ${result}`,
          color: "text-blue-400",
        };
      case "search_content":
        return {
          icon: <Search className="w-4 h-4 text-violet-500" />,
          text: `Searched for: ${result}`,
          color: "text-violet-500",
        };
      case "get_project_structure":
		return {
			icon: <FolderTree className="w-4 h-4 text-yellow-500" />,
			text: `Retrieved project structure with depth ${result}`,
			color: "text-yellow-500",
		};
      case "search_symbols":
        return {
          icon: <Code2 className="w-4 h-4 text-teal-500" />,
          text: `Searched for: ${result}`,
          color: "text-teal-500",
        };
      case "install_dependencies":
        return {
          icon: <Package className="w-4 h-4 text-orange-500" />,
          text: `Install: ${result}`,
          color: "text-orange-500",
        };
	case "check_integration":
		return {
			icon: <Workflow className="w-4 h-4 text-orange-500" />,
			text: `Checked for integration: ${result}`,
			color: "text-orange-500",
		};
	case "create_supabase_migration":
		return {
			icon: <Database className="w-4 h-4 text-green-700" />,
			text: `Created migration: ${result}`,
			color: "text-cyan-500",
		};
	case "edit_supabase_migration":
        return {
          icon: <Database className="w-4 h-4 text-cyan-500" />,
          text: `Edited migration: ${result}`,
          color: "text-cyan-500",
        };
      case "compile_code":
        return {
          icon: <Settings className="w-4 h-4 text-indigo-500" />,
          text: result || "Project compilation",
          color: "text-indigo-500",
        };
      case "error":
        return {
          icon: <FileWarning className="w-4 h-4 text-red-500" />,
          text: `Error: ${result}`,
          color: "text-red-500",
        };
      default:
        return {
          icon: <Settings className="w-4 h-4 text-gray-500" />,
          text: result || name,
          color: "text-gray-500",
        };
    }
  };

  const { icon, text } = getIconAndText();
  const status = toolCall.status || "complete"; // Default to complete for backward compatibility
  const isInProgress = status === "start" || status === "streaming";
  const isComplete = status === "complete";

  
  // Get loading text - show action name without result when in progress
  const getLoadingText = () => {
    if (!isInProgress) return text;
    
    // Extract the action part before the colon
    const actionMatch = text.match(/^([^:]+):/);
    if (actionMatch) {
      return `${actionMatch[1]}: ...`;
    }
    // Fallback: just show the tool name
    return `${name}...`;
  };

  const displayText = isInProgress ? getLoadingText() : text;

  const ToolContent = () => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-muted-foreground">{displayText}</span>
      </div>
      {/* Status indicator */}
      {isInProgress ? (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
        </motion.div>
      ) : isComplete ? (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: isAnimated ? delay + 0.2 : 0 }}
        >
          <CheckCircle className="w-3 h-3 text-green-500" />
        </motion.div>
      ) : null}
    </div>
  );

  if (isAnimated) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{
          duration: 0.4,
          delay,
          type: "spring",
          stiffness: 300,
          damping: 25,
        }}
        className="py-1 rounded-md"
      >
        <ToolContent />
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      {icon}
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
