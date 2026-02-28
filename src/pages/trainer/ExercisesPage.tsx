import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseForm } from "@/features/exercises/components/ExerciseForm";
import { ExerciseList } from "@/features/exercises/components/ExerciseList";
import { DeleteExerciseDialog } from "@/features/exercises/components/DeleteExerciseDialog";
import {
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from "@/features/exercises/hooks/useExercises";
import type { Exercise, ExerciseFormData } from "@/features/exercises/types";

export function ExercisesPage() {
  const { t } = useTranslation();

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(
    undefined
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(
    null
  );

  // Mutations
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  function handleOpenCreate() {
    setEditingExercise(undefined);
    setFormOpen(true);
  }

  function handleOpenEdit(exercise: Exercise) {
    setEditingExercise(exercise);
    setFormOpen(true);
  }

  function handleOpenDelete(exercise: Exercise) {
    setDeletingExercise(exercise);
    setDeleteDialogOpen(true);
  }

  function handleFormSubmit(data: ExerciseFormData) {
    if (editingExercise) {
      updateExercise.mutate(
        { id: editingExercise.id, updates: data },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditingExercise(undefined);
          },
        }
      );
    } else {
      createExercise.mutate(data, {
        onSuccess: () => {
          setFormOpen(false);
        },
      });
    }
  }

  function handleDeleteConfirm() {
    if (!deletingExercise) return;
    deleteExercise.mutate(deletingExercise.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingExercise(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("exercises.title")}</h1>
        {/* Desktop add button */}
        <Button
          onClick={handleOpenCreate}
          className="hidden min-h-[44px] sm:flex"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("exercises.add")}
        </Button>
      </div>

      {/* Exercise list */}
      <ExerciseList onEdit={handleOpenEdit} onDelete={handleOpenDelete} />

      {/* Mobile FAB */}
      <Button
        onClick={handleOpenCreate}
        size="icon"
        className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg sm:hidden"
        aria-label={t("exercises.add")}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Create/Edit dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditingExercise(undefined);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExercise
                ? t("exercises.edit")
                : t("exercises.add")}
            </DialogTitle>
          </DialogHeader>
          <ExerciseForm
            exercise={editingExercise}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingExercise(undefined);
            }}
            isLoading={createExercise.isPending || updateExercise.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <DeleteExerciseDialog
        exercise={deletingExercise}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteExercise.isPending}
      />
    </div>
  );
}
