/* eslint-disable */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

//All data necessary regarding a project
export type ProjectData = {
  projectId: string;
  projectName: string;
  description: string;
  builderSessionId: string | null;
  plannerSessionId: string | null;
  status: "Draft" | "Active";
  productDocMarkdown: string | null; //Markdown format of product document, document json will be interacted with in local state in plan page
  productDocBlocknote:  Record<string, any>[] | null;
  repoId: string | null;
  repoUrl: string;
  generatedPrd: boolean;
  previewUrl: string;
  createdAt: string;
  /** Markdown for architecture diagram, updated during build agent stream */
  architectureDoc: string | null;
  userId: string | undefined;
  lastDeployedAt: string | null;
  prodUrl: string | null
};

//Summary of project info
export type ProjectInfo = {
  projectId: string;
  projectName: string;
  status: "Draft" | "Active";
  createdAt: string
}

interface ProjectState {
  activeProject: ProjectData | null;
  isLoading: boolean;
  refreshKey: number;
  error: string | null;
  projectList: ProjectInfo[];
}

const initialState: ProjectState = {
  activeProject: null,
  refreshKey: 0,
  isLoading: false,
  error: null,
  projectList: []
};

/**
 * @description Redux slice for project state management
 * @param name - The name of the slice
 * @param initialState - The initial state of the slice
 * @param reducers - The reducers for the slice
 * @returns The project slice
 */
const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
      //Set current project data schema
      setCurrentProject: (state, action: PayloadAction<ProjectData>) => {
        state.activeProject = {
          ...action.payload,
          architectureDoc: action.payload.architectureDoc ?? null,
        };
        state.isLoading = false;
      },
      setProductDocMarkdown: (state, action: PayloadAction<string | null>) => {
        if (state.activeProject && action.payload) {
          state.activeProject.productDocMarkdown = action.payload;
        }
      },
      setArchitectureDoc: (state, action: PayloadAction<string | null>) => {
        if (state.activeProject) {
          state.activeProject.architectureDoc = action.payload ?? null;
        }
      },
      setLoading: (state, action: PayloadAction<boolean>) => {
        state.isLoading = action.payload;
      },
      setError: (state, action: PayloadAction<string | null>) => {
        state.error = action.payload;
      },
      setProjectList: (state, action: PayloadAction<ProjectInfo[]>) => {
        state.projectList = action.payload;
      },
      clearProjectData: (state) => {
        state.activeProject = null;
        state.error = null;
      },
      updateRefreshKey: (state) => {
        state.refreshKey += 1;
      }
    },
});

export const {
  setCurrentProject,
  //   setBuilderSessionId,
  //   setPlannerSessionId,
  setLoading,
  setProjectList,
  setError,
  clearProjectData,
  setProductDocMarkdown,
  updateRefreshKey,
  setArchitectureDoc,
} = projectSlice.actions;

export default projectSlice.reducer;
