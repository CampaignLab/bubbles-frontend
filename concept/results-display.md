```tsx
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { Result } from "@/lib/data";
import { PieChart, Users } from "lucide-react";

interface ResultsDisplayProps {
    result: Result | null;
    isLoading: boolean;
    boundarySelected: boolean;
}

export function ResultsDisplay({ result, isLoading, boundarySelected }: ResultsDisplayProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div><Skeleton className="h-5 w-20 mx-auto" /><Skeleton className="h-4 w-16 mx-auto mt-2" /></div>
                        <div><Skeleton className="h-5 w-20 mx-auto" /><Skeleton className="h-4 w-16 mx-auto mt-2" /></div>
                        <div><Skeleton className="h-5 w-20 mx-auto" /><Skeleton className="h-4 w-16 mx-auto mt-2" /></div>
                    </div>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!boundarySelected || !result) {
        return (
            <Card className="h-full flex items-center justify-center">
                <div className="text-center p-6">
                    <PieChart className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Data</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Select a boundary on the map to view audience insights.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audience Overview</CardTitle>
                <CardDescription>Key metrics for the selected boundary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <Users className="mx-auto h-6 w-6 text-primary" />
                        <p className="text-2xl font-bold mt-2">{(result.population / 1_000_000).toFixed(1)}M</p>
                        <p className="text-xs text-muted-foreground">Total Population</p>
                    </div>
                    <div>
                        <img src="/meta-logo.svg" alt="Meta Logo" className="mx-auto h-6 w-6" />
                        <p className="text-2xl font-bold mt-2">{(result.socialMedia.find(p => p.platform === 'Meta')!.users / 1_000_000).toFixed(1)}M</p>
                        <p className="text-xs text-muted-foreground">Meta Users</p>
                    </div>
                    <div>
                        <img src="/google-logo.svg" alt="Google Logo" className="mx-auto h-6 w-6" />
                        <p className="text-2xl font-bold mt-2">{(result.socialMedia.find(p => p.platform === 'Google')!.users / 1_000_000).toFixed(1)}M</p>
                        <p className="text-xs text-muted-foreground">Google Users</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Age Demographics</h4>
                    <ChartContainer config={{ percentage: { label: "Percentage", color: "hsl(var(--primary))" } }}>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={result.demographics} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="ageGroup" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis hide={true} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="percentage" fill="var(--color-percentage)" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}
