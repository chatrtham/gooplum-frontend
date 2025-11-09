import { MyAssistant } from "@/components/MyAssistant";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CreateFlowPage() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Flows
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Create New Flow</h1>
        </div>
      </header>
      <main className="flex-1">
        <MyAssistant />
      </main>
    </div>
  );
}
