
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="p-4">
          <h1 className="text-2xl font-bold tracking-tight">About</h1>
          <p className="text-muted-foreground">Information about the Documentation Committee</p>
        </div>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-auto">
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/28fdac2a-08bd-48c7-82a4-242c8a1d1874.png" 
                alt="CCS Documentation System" 
                className="h-24 w-auto" 
              />
            </div>
            <CardTitle className="text-3xl">Documentation Committee System</CardTitle>
            <CardDescription className="text-xl mt-2">
              College of Computer Studies
            </CardDescription>
          </CardHeader>
          <CardContent className="prose dark:prose-invert mx-auto text-center">
            <p>Created by: Tristan E. Listanco</p>
            
            <Separator className="my-8" />
          </CardContent>
        </Card>
        
        <footer className="text-center text-muted-foreground text-sm mt-8">
          <p>This Documentation Committee is supervised by the CCS Executive Council under the regulation of the College of Computer Studies.</p>
          <p className="mt-2">© 2025 Documentation Committee. All rights reserved.</p>
          <p>College of Computer Studies, MSU-IIT</p>
        </footer>
      </div>
    </div>
  );
}
