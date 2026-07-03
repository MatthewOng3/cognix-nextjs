import { useCallback } from "react";
import {
  clearProjectData,
  type ProjectData,
  setArchitectureDoc,
  setCurrentProject,
  setError,
  setLoading,
  setProductDocMarkdown,
  setProjectList,
} from "@/app/lib/redux/features/projectSlice";
import { useAppDispatch, useAppSelector } from "@/app/lib/redux/hooks";
import { getFullProjectData, getProjectList } from "../lib/api/project";

/**
 * @description Custom hook to access and manage project state in redux store
 * @returns Project state and actions
 */
export function useProject() {
  const dispatch = useAppDispatch();
  const activeProject = useAppSelector((state) => state.project.activeProject);
  const previewUrl = useAppSelector(
    (state) => state.project.activeProject?.previewUrl,
  );
  const builderSessionId = useAppSelector(
    (state) => state.project.activeProject?.builderSessionId,
  );
  const plannerSessionId = useAppSelector(
    (state) => state.project.activeProject?.plannerSessionId,
  );
  const isFetchLoaded = useAppSelector((state) => state.project.isLoading);
  const error = useAppSelector((state) => state.project.error);
  const projectList = useAppSelector((state) => state.project.projectList);
  const refreshKey = useAppSelector((state) => state.project.refreshKey);

  const fetchProjectInfo = useCallback(
    async (inputProjectId: string): Promise<ProjectData | null> => {
      try {
        const projectData = await getFullProjectData(inputProjectId);
        dispatch(setCurrentProject(projectData));

        try {
          // The workspace can render with just the active project; project list
          // fetches should not block or break the page if they fail.
          const latestProjectList = await getProjectList();
          dispatch(setProjectList(latestProjectList));
        } catch (projectListError) {
          console.log("Error fetching project list", projectListError);
        }

        return projectData;
      } catch (err) {
        console.log("Error fetching entire project data", err);
        return null;
      } finally {
        // Always clear the loading flag so the workspace cannot get stuck on a
        // spinner due to a secondary request failing.
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  const setCurrentProjectState = useCallback(
    (project: ProjectData) => dispatch(setCurrentProject(project)),
    [dispatch],
  );

  const setFetchLoading = useCallback(
    (loading: boolean) => dispatch(setLoading(loading)),
    [dispatch],
  );

  const setProjectError = useCallback(
    (nextError: string | null) => dispatch(setError(nextError)),
    [dispatch],
  );

  const clearProjectState = useCallback(
    () => dispatch(clearProjectData()),
    [dispatch],
  );

  const setProjectMarkdown = useCallback(
    (markdownDoc: string) => dispatch(setProductDocMarkdown(markdownDoc)),
    [dispatch],
  );

  const setProjectArchitecture = useCallback(
    (doc: string | null) => dispatch(setArchitectureDoc(doc)),
    [dispatch],
  );

  return {
    activeProject,
    previewUrl,
    builderSessionId,
    plannerSessionId,
    isFetchLoaded,
    projectList,
    error,
    refreshKey,

    setCurrentProject: setCurrentProjectState,
    setFetchLoading,
    setError: setProjectError,
    clearProjectData: clearProjectState,
    fetchProjectInfo,
    setProductDocMarkdown: setProjectMarkdown,
    setArchitectureDoc: setProjectArchitecture,
  };
}
