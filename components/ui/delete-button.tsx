"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DeleteButtonProps {
  /** ID of the item to delete */
  itemId: string;
  /** Optional file path to delete from Cloudinary/storage before database deletion */
  filePath?: string;
  /** Type of storage for file deletion */
  storageType?: "cloudinary" | "firebase" | "none";
  /** Callback function to execute the actual deletion */
  onDelete: (id: string, filePath?: string) => Promise<void>;
  /** Item name to display in confirmation dialog */
  itemName?: string;
  /** Button variant */
  variant?: "default" | "destructive" | "outline" | "ghost" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional CSS classes */
  className?: string;
  /** Custom confirmation message */
  confirmationMessage?: string;
  /** Show button as icon only */
  iconOnly?: boolean;
  /** Disable button during deletion */
  disabled?: boolean;
  /** Success callback */
  onSuccess?: () => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

export function DeleteButton({
  itemId,
  filePath,
  storageType = "none",
  onDelete,
  itemName = "this item",
  variant = "destructive",
  size = "sm",
  className,
  confirmationMessage,
  iconOnly = false,
  disabled = false,
  onSuccess,
  onError,
}: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(itemId, filePath);
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Delete error:", error);
      onError?.(error as Error);
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultMessage = `Are you sure you want to delete ${itemName}? This action cannot be undone.`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(className)}
          disabled={disabled || isDeleting}
        >
          <Trash2 className={cn("h-4 w-4", !iconOnly && "mr-2")} />
          {!iconOnly && "Delete"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="pt-2">
            {confirmationMessage || defaultMessage}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteButton;
