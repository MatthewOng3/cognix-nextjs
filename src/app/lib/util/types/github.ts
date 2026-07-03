//======================GITHUB WEBHOOK PAYLOAD TYPE=========================
type GithubHookData = {
  type: string; //Is it a repo hook or organization hook
  id: number;
  name: string; //
  active: boolean; //Is this webhook in use
  events: string[]; //String array of what events trigger this webhook
  updated_at: string;
  created_at: string;
  url: string;
  ping_url: string;
  deliveries_url: string;
};

type OrganizationInfo = {
  id: number;
  url: string;
  login: string;
};

type Sender = {
  login: string;
  id: number;
  html_url: string; //URL of sender profile
  type: string;
  site_admin: boolean;
};

type Repo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string; id: number };
};

export type GithubWebhook = {
  hook_id: number;
  hook: GithubHookData;
  organization: OrganizationInfo;
  sender: Sender;
  repository: Repo;
};
