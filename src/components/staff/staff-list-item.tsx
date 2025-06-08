
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Camera, Edit, Trash2 } from "lucide-react";
import { StaffMember } from "@/types/models";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface StaffListItemProps {
  staff: StaffMember;
  onEdit: () => void;
  onDelete: () => void;
  isOnLeave: boolean;
}

export default function StaffListItem({ staff, onEdit, onDelete, isOnLeave }: StaffListItemProps) {
  const { name, roles, subjectSchedules } = staff;
  
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {roles.includes("Videographer") && roles.includes("Photographer") ? (
              <div className="flex">
                <Video className="h-3 w-3 text-primary mr-1" />
                <Camera className="h-3 w-3 text-primary" />
              </div>
            ) : roles.includes("Videographer") ? (
              <Video className="h-5 w-5 text-primary" />
            ) : (
              <Camera className="h-5 w-5 text-primary" />
            )}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium truncate">{name}</h3>
            </div>
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-muted-foreground">{roles.join(' & ')}</p>
              {subjectSchedules && subjectSchedules.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Subjects: </span>
                  {subjectSchedules.map(ss => ss.subject).join(', ')}
                </div>
              )}
            </div>
          </div>
          
          {isOnLeave && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs flex-shrink-0">
              On Leave
            </Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
              <span className="sr-only">Open menu</span>
              <Edit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
