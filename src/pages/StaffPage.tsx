import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffFormDialog from "@/components/staff/staff-form-dialog";

export default function StaffPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
            <p className="text-muted-foreground">Manage your team members</p>
          </div>
          <StaffFormDialog />
        </div>
      </div>
      
      <div className="p-4 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Staff</TabsTrigger>
            <TabsTrigger value="videographers">Videographers</TabsTrigger>
            <TabsTrigger value="photographers">Photographers</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StaffCard 
                name="John Doe"
                role="Videographer"
                statistics={{ completed: 12, absent: 1, excused: 2 }}
              />
              <StaffCard 
                name="Jane Smith"
                role="Photographer"
                statistics={{ completed: 15, absent: 0, excused: 1 }}
              />
              <StaffCard 
                name="Mark Johnson"
                role="Videographer"
                statistics={{ completed: 8, absent: 2, excused: 0 }}
              />
            </div>
          </TabsContent>
          <TabsContent value="videographers" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StaffCard 
                name="John Doe"
                role="Videographer"
                statistics={{ completed: 12, absent: 1, excused: 2 }}
              />
              <StaffCard 
                name="Mark Johnson"
                role="Videographer"
                statistics={{ completed: 8, absent: 2, excused: 0 }}
              />
            </div>
          </TabsContent>
          <TabsContent value="photographers" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StaffCard 
                name="Jane Smith"
                role="Photographer"
                statistics={{ completed: 15, absent: 0, excused: 1 }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface StaffCardProps {
  name: string;
  role: "Videographer" | "Photographer";
  imageUrl?: string;
  statistics: {
    completed: number;
    absent: number;
    excused: number;
  };
}

function StaffCard({ name, role, imageUrl, statistics }: StaffCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={imageUrl} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">Completed</p>
            <p className="text-xl font-bold text-green-800 dark:text-green-400">{statistics.completed}</p>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-md">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">Absent</p>
            <p className="text-xl font-bold text-red-800 dark:text-red-400">{statistics.absent}</p>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Excused</p>
            <p className="text-xl font-bold text-yellow-800 dark:text-yellow-400">{statistics.excused}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
