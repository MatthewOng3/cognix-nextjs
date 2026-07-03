export const SUPABASE_API_URL="https://api.supabase.com"

export type CreateProjectResponse = {
    id: string; //Project ID or Ref
    organization_id: string;
    name: string;
    region: string;
    created_at: string;
    status: string;
}

export type SupabaseKeys = {
  name: string; //Similar to id below but I think user can rename it
	api_key: string; //Sensitive info dk how to handle it yet
	id: string;   //id identifying what type of key is it, service_role or anon
	type: string; 
	hash: string; //A hashed representation of the API key. Useful for Supabase internally to verify key integrity without exposing the full secret.
	prefix: string;
	description: string;
}

export type ConnectionConfig = {
	identifier: string;
	database_type: string;
	db_user: string,
	db_host: string,
	db_port: string,
	db_name: string,
	connection_string: string,
	connectionString: string,
	default_pool_size: string,
	max_client_conn: string,
	pool_mode: string
}

type SupabaseProjectInfo = {
	id: string;
	organization_id: string;
	
}

export type CreateProjectBody = {
    organization_id: string; 
    name: string;
    region: string;
    db_pass: string;
}

type Organization = {
    id: string;
    name: string;
}

export class SupabaseManagementAPI {
    private accessToken: string;
    private baseUrl: string;
  
    constructor(accessToken: string) {
        this.accessToken = accessToken;
        this.baseUrl = SUPABASE_API_URL
    }
    
    private async request<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                Accept: "application/json",
                "Content-Type": "application/json",
                ...options.headers,
            },
        });
        
        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(
            `Supabase API error ${res.status}: ${res.statusText} - ${errorBody}`
            );
        }
        
        return res.json()
    }
  
    // 🔹 Get all organizations the user has access to
    async listOrganizations(): Promise<Organization[]> {
      return this.request<{ id: string; name: string; slug: string }[]>(
        "/v1/organizations"
      );
    }
  
    // 🔹 Create a project
    async createProject(reqArgs: CreateProjectBody):Promise<CreateProjectResponse> {
        return this.request("/v1/projects", {
            method: "POST",
            body: JSON.stringify({...reqArgs}),
        });
    }
  
    // 🔹 Get project details
    async getProject(id: string) {
      return this.request<SupabaseProjectInfo>(`/v1/projects/${id}`);
    }
  
    // 🔹 Get project API keys (anon/service role)
    async getProjectApiKeys(ref: string, reveal = true) {
      return this.request<SupabaseKeys[]>(
        `/v1/projects/${ref}/api-keys?reveal=${reveal}`,
        { method: "GET" }
      );
    }
	
	// 🔹 Retrieve the connection string through session pooler to the database
    async getDbConnectionPooler(ref: string):Promise<ConnectionConfig[]> {
		return this.request(
		  `/v1/projects/${ref}/config/database/pooler`,
		  { method: "GET" }
		);
	}

    // 🔹 List all projects for a user
    async listProjects() {
      return this.request("/v1/projects");
    }
  }
  