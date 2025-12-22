"use client";

import { ChartDisplay } from "./ChartDisplay";

export interface Chart {
  id: string;
  url: string;
  title?: string;
}

interface ChartGalleryProps {
  charts: Chart[];
}

export function ChartGallery({ charts }: ChartGalleryProps) {
  if (charts.length === 0) {
    return null;
  }

  if (charts.length === 1) {
    return (
      <ChartDisplay
        src={charts[0].url}
        title={charts[0].title}
        chartId={charts[0].id}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {charts.map((chart) => (
        <ChartDisplay
          key={chart.id}
          src={chart.url}
          title={chart.title}
          chartId={chart.id}
        />
      ))}
    </div>
  );
}
