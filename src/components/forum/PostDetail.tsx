import { useState } from "react";
import { 
  ForumPost, 
  ForumComment, 
  useForumComments, 
  useCreateForumComment, 
  useToggleForumLike,
  useDeleteForumPost,
  useDeleteForumComment,
  useUpdateForumComment
} from "@/hooks/useForum";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart, MessageCircle, Clock, Send, ArrowLeft, MoreVertical, Pencil, Trash2, ImagePlus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { MentionTextarea } from "./MentionTextarea";
import { ImageUploadButton } from "./ImageUploadButton";
import { ClickableProfile } from "@/components/shared/ClickableProfile";

interface PostDetailProps {
  post: ForumPost | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (post: ForumPost) => void;
}

interface CommentItemProps {
  comment: ForumComment;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function CommentItem({ comment, isOwner, onEdit, onDelete }: CommentItemProps) {
  const authorName = comment.author?.nickname || 
    `${comment.author?.first_name || ""} ${comment.author?.last_name || ""}`.trim() || 
    "Unbekannt";

  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Parse @mentions in content
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-primary font-medium">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="flex gap-3 py-3 group">
      {comment.author ? (
        <ClickableProfile
          profile={comment.author}
          showName={false}
          avatarSize="sm"
          className="flex-shrink-0"
        />
      ) : (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {comment.author ? (
            <ClickableProfile
              profile={comment.author}
              showAvatar={false}
              nameClassName="text-sm"
            />
          ) : (
            <span className="font-medium text-sm">{authorName}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { 
              addSuffix: true, 
              locale: de 
            })}
          </span>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{renderContent(comment.content)}</p>
        {comment.image_url && (
          <img 
            src={comment.image_url} 
            alt="Kommentar-Bild" 
            className="mt-2 max-h-48 rounded-lg"
          />
        )}
      </div>
    </div>
  );
}

export function PostDetail({ post, open, onClose, onEdit }: PostDetailProps) {
  const { profile } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [commentImageUrl, setCommentImageUrl] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<ForumComment | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [deletePostDialogOpen, setDeletePostDialogOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  
  const { data: comments = [], isLoading: commentsLoading } = useForumComments(post?.id || null);
  const createComment = useCreateForumComment();
  const updateComment = useUpdateForumComment();
  const deleteComment = useDeleteForumComment();
  const deletePost = useDeleteForumPost();
  const toggleLike = useToggleForumLike();

  if (!post) return null;

  const isPostOwner = profile?.id === post.author_id;

  const authorName = post.author?.nickname || 
    `${post.author?.first_name || ""} ${post.author?.last_name || ""}`.trim() || 
    "Unbekannt";

  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Parse @mentions in content
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-primary font-medium">{part}</span>;
      }
      return part;
    });
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        postId: post.id,
        content: newComment.trim(),
        imageUrl: commentImageUrl || undefined,
      });
      setNewComment("");
      setCommentImageUrl(null);
      toast.success("Kommentar gepostet!");
    } catch (error) {
      toast.error("Fehler beim Posten des Kommentars");
    }
  };

  const handleEditComment = async () => {
    if (!editingComment || !editContent.trim()) return;

    try {
      await updateComment.mutateAsync({
        commentId: editingComment.id,
        postId: post.id,
        content: editContent.trim(),
        imageUrl: editImageUrl,
      });
      setEditingComment(null);
      setEditContent("");
      setEditImageUrl(null);
      toast.success("Kommentar aktualisiert!");
    } catch (error) {
      toast.error("Fehler beim Aktualisieren des Kommentars");
    }
  };

  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    try {
      await deleteComment.mutateAsync({
        commentId: deleteCommentId,
        postId: post.id,
      });
      setDeleteCommentId(null);
      toast.success("Kommentar gelöscht!");
    } catch (error) {
      toast.error("Fehler beim Löschen des Kommentars");
    }
  };

  const handleDeletePost = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      setDeletePostDialogOpen(false);
      onClose();
      toast.success("Beitrag gelöscht!");
    } catch (error) {
      toast.error("Fehler beim Löschen des Beitrags");
    }
  };

  const handleLike = () => {
    toggleLike.mutate({
      postId: post.id,
      hasLiked: post.user_has_liked || false,
    });
  };

  const startEditComment = (comment: ForumComment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
    setEditImageUrl(comment.image_url || null);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditContent("");
    setEditImageUrl(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
          <SheetHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <SheetTitle className="text-left">Beitrag</SheetTitle>
              </div>
              {isPostOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(post)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Bearbeiten
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeletePostDialogOpen(true)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Post Header */}
              <div className="flex items-start gap-3 mb-4">
                {post.author ? (
                  <ClickableProfile
                    profile={post.author}
                    showName={false}
                    avatarSize="lg"
                    className="h-12 w-12"
                  />
                ) : (
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {post.author ? (
                      <ClickableProfile
                        profile={post.author}
                        showAvatar={false}
                        nameClassName="font-semibold"
                      />
                    ) : (
                      <span className="font-semibold">{authorName}</span>
                    )}
                    {post.category && (
                      <Badge variant="secondary">{post.category.name}</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(post.created_at), { 
                      addSuffix: true, 
                      locale: de 
                    })}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <h2 className="text-xl font-bold mb-3">{post.title}</h2>
              <p className="text-muted-foreground whitespace-pre-wrap mb-4">{renderContent(post.content)}</p>

              {/* Post Image */}
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="Beitrags-Bild" 
                  className="mb-4 rounded-lg max-h-96 object-contain"
                />
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1 ${post.user_has_liked ? "text-red-500" : ""}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${post.user_has_liked ? "fill-current" : ""}`} />
                  {post.likes_count || 0}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {comments.length}
                </Button>
              </div>

              <Separator className="my-4" />

              {/* Comments */}
              <h3 className="font-semibold mb-3">Kommentare ({comments.length})</h3>
              
              {commentsLoading ? (
                <p className="text-muted-foreground text-sm">Lade Kommentare...</p>
              ) : comments.length === 0 ? (
                <p className="text-muted-foreground text-sm">Noch keine Kommentare. Sei der Erste!</p>
              ) : (
                <div className="divide-y">
                  {comments.map((comment) => (
                    editingComment?.id === comment.id ? (
                      <div key={comment.id} className="py-3 space-y-2">
                        <MentionTextarea
                          value={editContent}
                          onChange={setEditContent}
                          placeholder="Kommentar bearbeiten..."
                          minHeight="60px"
                        />
                        <ImageUploadButton 
                          imageUrl={editImageUrl} 
                          onImageChange={setEditImageUrl} 
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleEditComment} disabled={updateComment.isPending}>
                            Speichern
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditComment}>
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <CommentItem 
                        key={comment.id} 
                        comment={comment}
                        isOwner={profile?.id === comment.author_id}
                        onEdit={() => startEditComment(comment)}
                        onDelete={() => setDeleteCommentId(comment.id)}
                      />
                    )
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Comment Input */}
          {profile && (
            <div className="p-4 border-t flex-shrink-0 space-y-2">
              {commentImageUrl && (
                <div className="relative inline-block">
                  <img
                    src={commentImageUrl}
                    alt="Bild-Vorschau"
                    className="max-h-20 rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5"
                    onClick={() => setCommentImageUrl(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <MentionTextarea
                    value={newComment}
                    onChange={setNewComment}
                    placeholder="Schreibe einen Kommentar... (nutze @ für Erwähnungen)"
                    minHeight="60px"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <ImageUploadButton 
                    imageUrl={null} 
                    onImageChange={(url) => url && setCommentImageUrl(url)} 
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || createComment.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Post Dialog */}
      <AlertDialog open={deletePostDialogOpen} onOpenChange={setDeletePostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beitrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Beitrag und alle zugehörigen Kommentare werden unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kommentar löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Kommentar wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
