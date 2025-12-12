import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto p-8 sm:p-20 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to MPNext</h1>
        <p className="text-lg text-muted-foreground">Explore demos showcasing Ministry Platform integration capabilities</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Contact Lookup</CardTitle>
            <CardDescription>
              Contact Lookup shows an example of the full CRUD power of the MP API and quickly accessing data from the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/contactlookup">
              <Button className="w-full">View Demo</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Template Tool</CardTitle>
            <CardDescription>
              An example of an approach to build tools for MP
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/tools/template">
              <Button className="w-full">View Demo</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
