import type { IntegrationFlow, IntegrationType } from "../util/types/integration";

export const INTEGRATION_FLOWS: Record<IntegrationType, IntegrationFlow> = {
  supabase: {
    id: "supabase",
    name: "Supabase",
    description: "Database and authentication backend",
    icon: "🗄️",
    category: "database",
    estimatedTime: "2-3 minutes",
    steps: [
      {
        id: "auth",
        title: "Sign up for Supabase",
        description: "Create a Supabase account or sign in to your existing account",
        type: "auth",
        required: true,
        data: {
          url: "https://supabase.com/dashboard",
          action: "signup"
        }
      },
      {
        id: "create_project",
        title: "Create a new project",
        description: "Create a new Supabase project for your application",
        type: "config",
        required: true,
        data: {
          instructions: [
            "Click 'New Project' in your Supabase dashboard",
            "Choose your organization",
            "Enter a project name",
            "Set a database password",
            "Select a region close to your users"
          ]
        }
      },
      {
        id: "get_credentials",
        title: "Get API credentials",
        description: "Copy your project URL and anon key from the project settings",
        type: "config",
        required: true,
        data: {
          instructions: [
            "Go to Settings > API in your project dashboard",
            "Copy the 'Project URL'",
            "Copy the 'anon public' key",
            "Keep these credentials secure"
          ]
        }
      },
      {
        id: "test_connection",
        title: "Test connection",
        description: "Verify your Supabase connection is working",
        type: "test",
        required: true
      },
      {
        id: "complete",
        title: "Integration complete",
        description: "Supabase is now connected to your project",
        type: "complete",
        required: false
      }
    ]
  },
  
  stripe: {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing and billing",
    icon: "💳",
    category: "payment",
    estimatedTime: "3-5 minutes",
    steps: [
      {
        id: "auth",
        title: "Sign up for Stripe",
        description: "Create a Stripe account or sign in to your existing account",
        type: "auth",
        required: true,
        data: {
          url: "https://dashboard.stripe.com/register",
          action: "signup"
        }
      },
      {
        id: "get_api_keys",
        title: "Get API keys",
        description: "Retrieve your publishable and secret API keys from the Stripe dashboard",
        type: "config",
        required: true,
        data: {
          instructions: [
            "Go to Developers > API keys in your Stripe dashboard",
            "Copy the 'Publishable key' (starts with pk_)",
            "Copy the 'Secret key' (starts with sk_)",
            "Keep the secret key secure and never expose it publicly"
          ]
        }
      },
      {
        id: "configure_webhooks",
        title: "Configure webhooks",
        description: "Set up webhook endpoints for payment events",
        type: "config",
        required: false,
        data: {
          instructions: [
            "Go to Developers > Webhooks in your Stripe dashboard",
            "Add an endpoint URL for your application",
            "Select the events you want to listen for",
            "Copy the webhook signing secret"
          ]
        }
      },
      {
        id: "test_payment",
        title: "Test payment flow",
        description: "Test a payment using Stripe's test mode",
        type: "test",
        required: true
      },
      {
        id: "complete",
        title: "Integration complete",
        description: "Stripe is now connected to your project",
        type: "complete",
        required: false
      }
    ]
  },

  github: {
    id: "github",
    name: "GitHub",
    description: "Version control and repository management",
    icon: "🐙",
    category: "deployment",
    estimatedTime: "1-2 minutes",
    steps: [
      {
        id: "auth",
        title: "Connect GitHub account",
        description: "Authorize access to your GitHub account",
        type: "auth",
        required: true,
        data: {
          action: "oauth",
          provider: "github"
        }
      },
      {
        id: "select_repo",
        title: "Select repository",
        description: "Choose which repository to connect to your project",
        type: "config",
        required: true
      },
      {
        id: "complete",
        title: "Integration complete",
        description: "GitHub is now connected to your project",
        type: "complete",
        required: false
      }
    ]
  },

  vercel: {
    id: "vercel",
    name: "Vercel",
    description: "Deployment and hosting platform",
    icon: "▲",
    category: "deployment",
    estimatedTime: "2-3 minutes",
    steps: [
      {
        id: "auth",
        title: "Connect Vercel account",
        description: "Sign in to Vercel or create a new account",
        type: "auth",
        required: true,
        data: {
          url: "https://vercel.com/signup",
          action: "signup"
        }
      },
      {
        id: "get_token",
        title: "Get deployment token",
        description: "Generate a Vercel API token for deployments",
        type: "config",
        required: true,
        data: {
          instructions: [
            "Go to Account Settings > Tokens in your Vercel dashboard",
            "Click 'Create Token'",
            "Give it a name like 'Cognix Deployments'",
            "Copy the generated token"
          ]
        }
      },
      {
        id: "test_deploy",
        title: "Test deployment",
        description: "Test a sample deployment to verify the connection",
        type: "test",
        required: true
      },
      {
        id: "complete",
        title: "Integration complete",
        description: "Vercel is now connected to your project",
        type: "complete",
        required: false
      }
    ]
  },

  openai: {
    id: "openai",
    name: "OpenAI",
    description: "AI and language model services",
    icon: "🤖",
    category: "ai",
    estimatedTime: "1-2 minutes",
    steps: [
      {
        id: "auth",
        title: "Get OpenAI API key",
        description: "Sign up for OpenAI and get your API key",
        type: "auth",
        required: true,
        data: {
          url: "https://platform.openai.com/api-keys",
          action: "get_key"
        }
      },
      {
        id: "test_api",
        title: "Test API connection",
        description: "Verify your OpenAI API key works correctly",
        type: "test",
        required: true
      },
      {
        id: "complete",
        title: "Integration complete",
        description: "OpenAI is now connected to your project",
        type: "complete",
        required: false
      }
    ]
  }
};

export function getIntegrationFlow(type: IntegrationType): IntegrationFlow | undefined {
  return INTEGRATION_FLOWS[type];
}

export function getAllIntegrationFlows(): IntegrationFlow[] {
  return Object.values(INTEGRATION_FLOWS);
}
