
import { PageTitle } from "@/components/shared/page-title";
import { StatCard } from "@/components/shared/stat-card";
import { DollarSign, TrendingUp, TrendingDown, Landmark, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  // Placeholder data
  const dailyRevenue = {
    total: "$12,345.00",
    cashAtHand: "$2,500.00",
    cashReceived: "$10,000.00",
    cashPaidOut: "$1,500.00",
    cashOwing: "$800.00",
    cashOwed: "$1,200.00",
  };

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Daily overview of hotel operations and revenue." icon={DollarSign}>
        <Button>View Full Report</Button>
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        <StatCard
          title="Total Revenue (Today)"
          value={dailyRevenue.total}
          icon={TrendingUp}
          description="+5.2% from yesterday"
          className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500"
        />
        <StatCard
          title="Cash at Hand"
          value={dailyRevenue.cashAtHand}
          icon={Landmark}
          className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500"
        />
        <StatCard
          title="Cash Received (Today)"
          value={dailyRevenue.cashReceived}
          icon={TrendingUp}
           className="bg-gradient-to-r from-sky-500/10 to-sky-600/10 border-sky-500"
        />
        <StatCard
          title="Cash Paid Out (Today)"
          value={dailyRevenue.cashPaidOut}
          icon={TrendingDown}
          className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500"
        />
        <StatCard
          title="Cash Owing (Debtors)"
          value={dailyRevenue.cashOwing}
          icon={Users}
          description="3 Active Debtors"
           className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500"
        />
         <StatCard
          title="Cash Owed (Creditors)"
          value={dailyRevenue.cashOwed}
          icon={AlertTriangle}
          description="Payable to 5 suppliers"
           className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Revenue Breakdown</CardTitle>
            <CardDescription className="font-body">Performance of different revenue streams today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm font-medium font-body">Rooms</span>
                <span className="text-sm font-semibold font-body">$5,500</span>
              </div>
              <Progress value={5500 / 12345 * 100} aria-label="Rooms revenue progress" />
            </div>
            <div>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm font-medium font-body">Main Bar</span>
                <span className="text-sm font-semibold font-body">$3,200</span>
              </div>
              <Progress value={3200 / 12345 * 100} aria-label="Main bar revenue progress" className="[&>div]:bg-accent" />
            </div>
            <div>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm font-medium font-body">Restaurant</span>
                <span className="text-sm font-semibold font-body">$2,845</span>
              </div>
              <Progress value={2845 / 12345 * 100} aria-label="Restaurant revenue progress" />
            </div>
             <div>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm font-medium font-body">Conference Halls</span>
                <span className="text-sm font-semibold font-body">$800</span>
              </div>
              <Progress value={800 / 12345 * 100} aria-label="Conference halls revenue progress" className="[&>div]:bg-secondary-foreground" />
            </div>
          </CardContent>
          <CardFooter>
             <p className="text-xs text-muted-foreground font-body">Updated 5 minutes ago.</p>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Quick Actions</CardTitle>
             <CardDescription className="font-body">Common tasks at your fingertips.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="default" size="lg">Add New Reservation</Button>
            <Button variant="outline" size="lg">Record Expense</Button>
            <Button variant="outline" size="lg">Update Inventory</Button>
            <Button variant="secondary" size="lg">Generate Daily Summary</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
