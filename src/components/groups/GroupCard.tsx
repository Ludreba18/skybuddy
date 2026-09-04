import { Link } from "react-router-dom";
import { Globe, Lock, Users } from "lucide-react";
import { Group } from "@/hooks/useGroups";

export function GroupCard({ group }: { group: Group }) {
  const initials = group.name.slice(0, 2).toUpperCase();

  return (
    <Link
      to={`/groups/${group.id}`}
      className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
        {group.avatar_url ? (
          <img src={group.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-heading font-bold text-primary">{initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold truncate">{group.name}</h3>
          {group.visibility === "private" ? (
            <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
        </div>
        {group.description && <p className="text-sm text-muted-foreground truncate">{group.description}</p>}
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          {group.member_count ?? 0} {group.member_count === 1 ? "Mitglied" : "Mitglieder"}
        </div>
      </div>
    </Link>
  );
}
