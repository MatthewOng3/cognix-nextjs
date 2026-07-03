//========= ENV CONFIG===========

type Environment = "development" | "production"

interface AppConfig {
    appBaseUrl: string;
    aiServerUrl: string; 
    supabaseAnonKey: string;
    supabaseServiceKey: string;
    supabaseUrl:  string;
    domain: string;
    subdomain: string;      
    sendgridKey: string;
    resendKey: string;
    pineconeApiKey: string;
    dokkuDeployKey: string
    adminUserId: string;
}

// Base static values that are shared across environments
const BASE_CONFIG = {
  domain: process.env.DOMAIN || "cognix.live",
  subdomain: process.env.DOKKU_OCEAN_SUBDOMAIN || "",
  sendgridKey: process.env.SENDGRID_API || "",
  resendKey: process.env.RESEND_API || "",
  pineconeApiKey: process.env.PINECONE_API_KEY || "",
  dokkuDeployKey: process.env.DOKKU_DEPLOY_KEY || ""
};

const CONFIG: Record<Environment, AppConfig> = {
  development: {
    ...BASE_CONFIG,
    appBaseUrl: process.env.APP_BASE_URL_DEV || "http://localhost:3000",
    aiServerUrl: process.env.AI_SERVER_DEV || "http://127.0.0.1:8000",
    supabaseUrl: process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY || "",
    supabaseServiceKey: process.env.NEXT_DEV_SUPABASE_SERVICE_KEY || "",
    adminUserId: process.env.NEXT_PUBLIC_DEV_ADMIN_USER_ID || ""
  },
  production: {
    ...BASE_CONFIG,
    appBaseUrl: process.env.APP_BASE_URL_PROD || "https://cognix.live",
    aiServerUrl: process.env.AI_SERVER_PROD ?? "",
    supabaseUrl: process.env.NEXT_PUBLIC_PROD_SUPABASE_URL || "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY || "",
    supabaseServiceKey: process.env.NEXT_PROD_SUPABASE_SERVICE_KEY || "",
    adminUserId: process.env.NEXT_PUBLIC_PROD_ADMIN_USER_ID || ""
  },
};

// Helper function
export function getConfig(): AppConfig {
  const env = (process.env.NODE_ENV as Environment) || "development";
 
  return CONFIG[env];
}

// Optional direct export
export const envConfig = getConfig();
