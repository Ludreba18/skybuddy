import { ForumCategory } from "@/hooks/useForum";
import { Card, CardContent } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  category: ForumCategory;
  postCount?: number;
  isSelected?: boolean;
  onClick: () => void;
}

export function CategoryCard({ category, postCount = 0, isSelected, onClick }: CategoryCardProps) {
  // Dynamically get the icon component
  const IconComponent = category.icon 
    ? (Icons[category.icon as keyof typeof Icons] as LucideIcon) 
    : Icons.MessageCircle;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {IconComponent && <IconComponent className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{category.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{category.description}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {postCount} {postCount === 1 ? "Beitrag" : "Beiträge"}
        </div>
      </CardContent>
    </Card>
  );
}
