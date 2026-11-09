import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { makeSlug } from "@/lib/slug";
import { z } from "zod";

async function uniqueSlug(title: string, excludeId?: number) {
  const base = makeSlug(title).slice(0, 260) || "jharkhand-update";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const [rows]: any = await getPool().execute(
      `SELECT id FROM posts WHERE slug=? ${excludeId ? "AND id<>?" : ""} LIMIT 1`,
      excludeId ? [candidate, excludeId] : [candidate]
    );
    if (!rows.length) return candidate;
    candidate = `${base.slice(0, 270 - String(suffix).length)}-${suffix++}`;
  }
}

function mysqlDateTime(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export async function POST(req: Request) {
  let connection: any;
  try {
    await requireAdmin();
    const b = z.record(z.string(), z.any()).parse(await req.json());
    const title = String(b.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

    const status = ["draft", "published", "scheduled"].includes(b.status) ? b.status : "draft";
    const scheduledAt = status === "scheduled" ? mysqlDateTime(b.scheduled_at) : null;
    if (status === "scheduled" && (!scheduledAt || new Date(scheduledAt.replace(" ", "T") + "Z").getTime() <= Date.now())) {
      return NextResponse.json({ error: "Choose a valid future date and time for scheduled publishing." }, { status: 400 });
    }

    const categoryIds = [...new Set((Array.isArray(b.category_ids) ? b.category_ids : [b.category_id])
      .map((value: any) => Number(value)).filter((value: number) => Number.isInteger(value) && value > 0))];
    if (!categoryIds.length) return NextResponse.json({ error: "Select at least one category." }, { status: 400 });

    const pool = getPool();
    const [validCategories]: any = await pool.query("SELECT id FROM categories WHERE id IN (?) AND is_active=1", [categoryIds]);
    if (validCategories.length !== categoryIds.length) return NextResponse.json({ error: "One or more selected categories are invalid." }, { status: 400 });

    const slug = await uniqueSlug(title);
    const json = (value: any) => {
      if (!value) return null;
      try { return JSON.stringify(JSON.parse(value)); } catch { return JSON.stringify({ details: String(value) }); }
    };

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [result]: any = await connection.execute(
      `INSERT INTO posts
      (title,slug,category_id,short_description,organization,source_url,application_url,status,verification_status,important_dates,application_fee,age_limit,vacancy_details,qualification,selection_process,how_to_apply,important_links,faqs,notice_text,seo_title,seo_description,layout_direction,layout_columns,theme_primary,theme_accent,theme_background,theme_text,image_url,image_title,custom_tables,published_at,scheduled_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,IF(?=1,NOW(),NULL),?)`,
      [title,slug,categoryIds[0],b.short_description||null,b.organization||null,b.source_url||null,b.application_url||null,status,b.verification_status||"unverified",json(b.important_dates),json(b.application_fee),json(b.age_limit),json(b.vacancy_details),b.qualification||null,b.selection_process||null,b.how_to_apply||null,json(b.important_links),json(b.faqs),b.notice_text||null,b.seo_title||null,b.seo_description||null,b.layout_direction||"row",Number(b.layout_columns)||2,b.theme_primary||"#173f70",b.theme_accent||"#e87920",b.theme_background||"#ffffff",b.theme_text||"#182638",b.image_url||null,b.image_title||null,json(b.custom_tables),status === "published" ? 1 : 0,scheduledAt]
    );
    await connection.query("INSERT INTO post_categories (post_id,category_id) VALUES ?", [categoryIds.map((categoryId: number) => [result.insertId,categoryId])]);
    await connection.commit();
    return NextResponse.json({ ok: true, id: result.insertId, slug });
  } catch (error: any) {
    if (connection) await connection.rollback();
    const unauthorized = error?.message === "UNAUTHORIZED";
    console.error("Create post error:", error);
    return NextResponse.json({ error: unauthorized ? "Please sign in." : error.code === "ER_DUP_ENTRY" ? "A post with this URL slug already exists. Change the title and try again." : "Could not save post. Please check the required fields and try again." }, { status: unauthorized ? 401 : 400 });
  } finally {
    connection?.release();
  }
}
