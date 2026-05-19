import { NextResponse } from "next/server";
import {
  getComboComponents,
  replaceComboComponents,
} from "@repo/database/services";
import { getTenantManagerRequest, getTenantRequest } from "@repo/auth/tenant-next";
import { comboComponentsUpdateSchema } from "@repo/salon-core/forms/service";
import { validationErrorResponse } from "../../../validation";

function comboComponentErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "";
  if (msg.includes("combo service not found")) {
    return NextResponse.json({ error: "پکیج یافت نشد" }, { status: 404 });
  }
  if (msg.includes("active combo service must have at least one component")) {
    return NextResponse.json(
      { error: "پکیج فعال باید حداقل یک خدمت در ترکیب خود داشته باشد" },
      { status: 400 },
    );
  }
  if (msg.includes("combo service cannot contain itself")) {
    return NextResponse.json(
      { error: "پکیج نمی‌تواند شامل خودش باشد" },
      { status: 400 },
    );
  }
  if (msg.includes("combo components cannot contain duplicates")) {
    return NextResponse.json(
      { error: "هر خدمت فقط یک بار می‌تواند در پکیج باشد" },
      { status: 400 },
    );
  }
  if (msg.includes("combo component service not found")) {
    return NextResponse.json(
      { error: "یکی از خدمات انتخاب‌شده پیدا نشد" },
      { status: 400 },
    );
  }
  if (msg.includes("combo service cannot contain another combo service")) {
    return NextResponse.json(
      { error: "پکیج نمی‌تواند شامل پکیج دیگری باشد" },
      { status: 400 },
    );
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await getTenantRequest(request);
    if (!tenant.ok) return tenant.response;
    const { user } = tenant;
    const { id } = await params;

    const combo = await getComboComponents(id, user.salonId);
    if (!combo) {
      return NextResponse.json({ error: "پکیج یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ combo });
  } catch (error) {
    console.error("Get combo components error:", error);
    return NextResponse.json(
      { error: "خطای سرور. لطفاً دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await getTenantManagerRequest(request);
    if (!tenant.ok) return tenant.response;
    const { user } = tenant;
    const { id } = await params;

    const parsed = comboComponentsUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const combo = await replaceComboComponents(
      id,
      user.salonId,
      parsed.data.componentServiceIds,
    );
    return NextResponse.json({ combo });
  } catch (error: unknown) {
    console.error("Update combo components error:", error);
    return (
      comboComponentErrorResponse(error) ??
      NextResponse.json(
        { error: "خطای سرور. لطفاً دوباره تلاش کنید." },
        { status: 500 },
      )
    );
  }
}
