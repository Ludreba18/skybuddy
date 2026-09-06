import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessStatus } from "@/hooks/useAccessStatus";
import { useConversations, Conversation, useMarkConversationRead } from "@/hooks/useConversations";
import { useMessages, useSendMessage, Message } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MessageCircle, Send, Plane, User, Mail, LogOut } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ClickableProfile } from "@/components/shared/ClickableProfile";
import { JoinRequestBanner } from "@/components/messages/JoinRequestBanner";

const ConversationItem = ({ 
  conversation, 
  currentProfileId,
  isActive,
  onClick 
}: { 
  conversation: Conversation;
  currentProfileId: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  // Get the other participant (for 1:1 chats)
  const otherParticipant = conversation.participants.find(
    p => p.profile_id !== currentProfileId
  )?.profile;

  const displayName = otherParticipant?.nickname || 
    [otherParticipant?.first_name, otherParticipant?.last_name].filter(Boolean).join(" ") ||
    "Unbekannt";

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
        isActive ? "bg-primary/10" : "hover:bg-muted"
      )}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherParticipant?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        {conversation.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold rounded-full">
            {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate", conversation.unread_count > 0 && "font-semibold")}>{displayName}</p>
        {conversation.last_message && (
          <p className={cn(
            "text-sm truncate",
            conversation.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {conversation.last_message.content}
          </p>
        )}
      </div>
      {conversation.last_message && (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(conversation.last_message.created_at), { 
            addSuffix: false, 
            locale: de 
          })}
        </span>
      )}
    </button>
  );
};

const MessageBubble = ({ 
  message, 
  isOwn 
}: { 
  message: Message; 
  isOwn: boolean;
}) => {
  return (
    <div className={cn("flex gap-2 mb-3", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {(message.sender?.nickname || message.sender?.first_name || "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-2",
        isOwn 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted rounded-bl-md"
      )}>
        <p className="text-sm">{message.content}</p>
        <p className={cn(
          "text-xs mt-1",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: de })}
        </p>
      </div>
    </div>
  );
};

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, loading, signOut } = useAuth();
  const { hasActiveAccess } = useAccessStatus();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversation")
  );
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading } = useConversations();
  const { data: messages, isLoading: messagesLoading } = useMessages(selectedConversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationRead();

  const displayName = profile?.nickname || profile?.first_name || "Pilot";

  // Navigation items
  const navItems = [
    { name: "Mein Cockpit", href: "/dashboard" },
    { name: "Piloten", href: "/pilots" },
    { name: "Fly-Outs & Events", href: "/events" },
    { name: "Gruppen", href: "/groups" },
    { name: "Forum", href: "/forum" },
    { name: "Nachrichten", href: "/messages", active: true },
  ];

  // Handle URL parameter for conversation
  useEffect(() => {
    const conversationFromUrl = searchParams.get("conversation");
    if (conversationFromUrl) {
      setSelectedConversationId(conversationFromUrl);
    }
  }, [searchParams]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId) {
      markAsRead(selectedConversationId);
    }
  }, [selectedConversationId, markAsRead]);

  // Get selected conversation details
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);
  const otherParticipant = selectedConversation?.participants.find(
    p => p.profile_id !== profile?.id
  )?.profile;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversationId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConversationId,
        content: messageText.trim()
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Plane className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!user || !profile) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="h-screen bg-muted/30 flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center shadow-md">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl hidden sm:block">
                Sky<span className="text-primary">Buddy</span>
              </span>
            </Link>

            {/* Header Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/messages"
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Mail className="w-5 h-5 text-primary" />
              </Link>
              <NotificationDropdown />
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">{displayName}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="text-muted-foreground"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Secondary Navigation - Sticky */}
      <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Messages Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Conversation List - hidden on mobile when conversation selected */}
        <div className={cn(
          "w-full md:w-80 border-r bg-card flex flex-col",
          selectedConversationId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b bg-card shrink-0">
            <div className="flex items-center gap-2">
              {selectedConversationId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversationId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <h2 className="font-heading font-bold text-lg">Nachrichten</h2>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              {conversationsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="h-12 w-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-32 bg-muted rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      currentProfileId={profile.id}
                      isActive={conv.id === selectedConversationId}
                      onClick={() => setSelectedConversationId(conv.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Unterhaltungen.</p>
                  <p className="text-sm mt-2">Starte eine Unterhaltung über das Profil eines Piloten.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Messages View */}
        <div className={cn(
          "flex-1 flex flex-col min-h-0",
          !selectedConversationId ? "hidden md:flex" : "flex"
        )}>
          {selectedConversationId ? (
            <>
              {/* Chat Header - fixed at top */}
              <div className="shrink-0 flex items-center gap-3 p-4 border-b bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={() => setSelectedConversationId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                {otherParticipant && (
                  <ClickableProfile profile={{ id: otherParticipant.id, first_name: otherParticipant.first_name, last_name: otherParticipant.last_name, nickname: otherParticipant.nickname, avatar_url: otherParticipant.avatar_url }}>
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                        <AvatarImage src={otherParticipant.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {(otherParticipant.nickname || otherParticipant.first_name || "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {otherParticipant.nickname || 
                            [otherParticipant.first_name, otherParticipant.last_name].filter(Boolean).join(" ") ||
                            "Unbekannt"}
                        </span>
                        {otherParticipant.last_seen_at && (
                          <span className="text-xs text-muted-foreground">
                            Zuletzt aktiv {formatDistanceToNow(new Date(otherParticipant.last_seen_at), { 
                              addSuffix: true, 
                              locale: de 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </ClickableProfile>
                )}
              </div>

              <JoinRequestBanner conversationId={selectedConversationId} currentProfileId={profile.id} />

              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div>
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === profile.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Keine Nachrichten. Schreibe die erste!</p>
                  </div>
                )}
              </ScrollArea>

              {/* Message Input - fixed at bottom */}
              <form onSubmit={handleSendMessage} className="shrink-0 p-4 border-t bg-background">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Nachricht schreiben..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!messageText.trim() || sendMessage.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Wähle eine Unterhaltung aus</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
