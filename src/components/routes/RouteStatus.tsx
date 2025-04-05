"use client";

import { Badge } from "../ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../ui/button";

type RouteStatus = "pending" | "approved" | "rejected" | undefined;

interface RouteStatusProps {
  status: RouteStatus;
  onStatusChange?: (status: "approved" | "rejected") => void;
}

export const getStatusColor = (status?: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
    case "pending":
    default:
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
  }
};

export const getStatusLabel = (status?: string) => {
  switch (status) {
    case "approved":
      return "Aprovada";
    case "rejected":
      return "Rejeitada";
    case "pending":
    default:
      return "Pendente";
  }
};

export const RouteStatusBadge = ({ status }: { status: RouteStatus }) => {
  return (
    <Badge
      className={`${getStatusColor(status)} text-xs font-medium py-1 px-2`}
    >
      {getStatusLabel(status)}
    </Badge>
  );
};

export const RouteStatusActions = ({
  status,
  onStatusChange,
}: RouteStatusProps) => {
  if (status !== "pending" || !onStatusChange) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
        onClick={() => onStatusChange("approved")}
      >
        <CheckCircle2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        onClick={() => onStatusChange("rejected")}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function RouteStatus({
  status,
  onStatusChange,
}: RouteStatusProps) {
  return (
    <div className="flex items-center justify-between">
      <RouteStatusBadge status={status} />
      <RouteStatusActions status={status} onStatusChange={onStatusChange} />
    </div>
  );
}
