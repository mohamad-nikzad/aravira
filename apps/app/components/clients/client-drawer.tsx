"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@repo/ui/drawer";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Badge } from "@repo/ui/badge";
import { Field, FieldLabel, FieldGroup, FieldError } from "@repo/ui/field";
import { Spinner } from "@repo/ui/spinner";
import { Client } from "@repo/salon-core/types";
import { displayPhone, normalizePhone } from "@repo/salon-core/phone";
import {
  clientFormSchema,
  type ClientFormInput,
} from "@repo/salon-core/forms/client";
import { DataClientHttpError } from "@repo/data-client";
import { useManagerDataClient } from "@/components/manager-data-client-provider";
import { runMutation } from "@/lib/run-mutation";

const tagOptions = [
  "VIP",
  "حساسیت",
  "رنگ خاص",
  "نیاز به پیگیری",
  "بدقول",
] as const;

interface ClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSuccess: () => void;
}

const emptyValues: ClientFormInput = {
  name: "",
  phone: "",
  notes: "",
  tags: [],
};

function toFormValues(client: Client): ClientFormInput {
  return {
    name: client.name,
    phone: client.phone ?? "",
    notes: client.notes ?? "",
    tags: client.tags?.map((tag) => tag.label) ?? [],
  };
}

export function ClientDrawer({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientDrawerProps) {
  const dataClient = useManagerDataClient();
  const isEditing = !!client;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: emptyValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (open) reset(client ? toFormValues(client) : emptyValues);
  }, [open, client, reset]);

  const nameValue = watch("name");
  const phoneValue = watch("phone");

  const onSubmit = handleSubmit(async (values) => {
    const result = await runMutation(async () => {
      if (dataClient) {
        if (isEditing && client) {
          await dataClient.clients.update(client.id, values);
        } else {
          await dataClient.clients.create(values);
        }
        void dataClient.sync.processPending();
        return;
      }

      const url = isEditing ? `/api/clients/${client?.id}` : "/api/clients";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new DataClientHttpError(
          data.error || "ذخیره اطلاعات مشتری انجام نشد",
          res.status,
          data,
        );
      }
    });

    if (result.ok) onSuccess();
  });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditing ? "ویرایش مشتری" : "مشتری جدید"}</DrawerTitle>
          <DrawerDescription>
            {isEditing
              ? "اطلاعات مشتری را به‌روز کنید"
              : "مشتری جدید به سالن اضافه کنید"}
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 overflow-auto p-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="client-name">نام</FieldLabel>
              <Input
                id="client-name"
                placeholder="نام مشتری"
                {...register("name")}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="client-phone">شماره تماس</FieldLabel>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <Input
                    id="client-phone"
                    type="tel"
                    value={displayPhone(field.value ?? "")}
                    onChange={(e) =>
                      field.onChange(normalizePhone(e.target.value))
                    }
                    onBlur={field.onBlur}
                    placeholder="۰۹۱۲…"
                    dir="ltr"
                    className="text-left tabular-nums"
                  />
                )}
              />
              {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="client-notes">یادداشت (اختیاری)</FieldLabel>
              <Input
                id="client-notes"
                placeholder="یادداشت درباره این مشتری…"
                {...register("notes")}
              />
            </Field>

            <Field>
              <FieldLabel>برچسب‌ها</FieldLabel>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => {
                  const current = field.value ?? [];
                  const toggle = (label: string) =>
                    field.onChange(
                      current.includes(label)
                        ? current.filter((t) => t !== label)
                        : [...current, label],
                    );
                  return (
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggle(label)}
                          className="touch-manipulation"
                        >
                          <Badge
                            variant={
                              current.includes(label) ? "default" : "outline"
                            }
                            className="px-2.5 py-1"
                          >
                            {label}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  );
                }}
              />
            </Field>
          </FieldGroup>
        </form>

        <DrawerFooter>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !nameValue || !phoneValue}
            className="touch-manipulation"
          >
            {isSubmitting && <Spinner className="ml-2" />}
            {isSubmitting
              ? "در حال ذخیره…"
              : isEditing
                ? "ذخیره تغییرات"
                : "افزودن مشتری"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">انصراف</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
