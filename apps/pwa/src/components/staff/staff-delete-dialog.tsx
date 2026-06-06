import type { User } from '@repo/salon-core/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog'

type StaffDeleteDialogProps = {
  open: boolean
  staff: User | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function StaffDeleteDialog({
  open,
  staff,
  isPending,
  onOpenChange,
  onConfirm,
}: StaffDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader className="text-start">
          <AlertDialogTitle>حذف پرسنل؟</AlertDialogTitle>
          <AlertDialogDescription className="text-start">
            {staff
              ? `${staff.name} از فهرست پرسنل و دسترسی سالن حذف می‌شود، اما سوابق نوبت‌ها باقی می‌ماند.`
              : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>انصراف</AlertDialogCancel>
          <AlertDialogAction
            disabled={!staff || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isPending ? 'در حال حذف…' : 'حذف پرسنل'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
