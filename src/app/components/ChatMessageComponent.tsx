/* eslint-disable */

// ChatMessageComponents.tsx
import { ChatContentComponentType } from "../lib/util/supabase/types/tables";
import Integration from "./Integration";


//Map of component types strings keys to actual components
//Component types are just possible components we can have in a message, currently only integration stuff
export const ChatComponentRegistry: Record<
  string,
  React.ComponentType<any>
> = {
    integration: Integration,
    //Add more component types after
};

type Props = {
    componentInfo: ChatContentComponentType;
}

/**
 * @description Dynamically renders the correct UI component inside a chat message.
 * @param componentInfo.component_type - Which component in the registry to render
 * @param componentInfo.component_props - Props to pass into that component
 */
function ChatMessageComponent({componentInfo}: Props){
    const Component = ChatComponentRegistry[componentInfo.component_type];

    return(
        <div className="w-full">
            <Component {...componentInfo.component_props}/>
        </div>
    )
}

export default ChatMessageComponent; 