import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { z } from "zod";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let connection: any;
  try {
    await requireAdmin();
    const { id } = await params;
    const b = z.record(z.any()).parse(await req.json());
    const categoryIds = [...new Set(
      (Array.isArray(b.category_ids) ? b.category_ids : [b.category_id])
        .map((value: any) => Number(value))
        .filter((value: number) => Number.isInteger(value) && value > 0)
    )];

    if (!categoryIds.length) {
      return NextResponse.json({ error: "Select at least one category." }, { status: 400 });
    }

    const pool = getPool();
    const [validCategories]: any = await pool.query(
      "SELECT id FROM categories WHERE id IN (?) AND is_active=1",
      [categoryIds]
    );
    if (validCategories.length !== categoryIds.length) {
      return NextResponse.json({ error: "One or more selected categories are invalid." }, { status: 400 });
    }

    const json = (value: any) => {
      if (!value) return null;
      try { return JSON.stringify(JSON.parse(value)); }
      catch { return JSON.stringify({ details: String(value) }); }
    };

    connection = await pool.getConnection();
    await connection.beginTransaction();
    await connection.execute(
      `UPDATE posts SET title=?,category_id=?,short_description=?,organization=?,source_url=?,application_url=?,status=?,verification_status=?,important_dates=?,application_fee=?,age_limit=?,vacancy_details=?,qualification=?,selection_process=?,how_to_apply=?,important_links=?,faqs=?,notice_text=?,seo_title=?,seo_description=?,layout_direction=?,layout_columns=?,theme_primary=?,theme_accent=?,theme_background=?,theme_text=?,image_url=?,image_title=?,custom_tables=?,published_at=IF(?='published',NOW(),NULL) WHERE id=?`,
      [
        b.title, categoryIds[0], b.short_description || null, b.organization || null,
        b.source_url || null, b.application_url || null, b.status || "draft",
        b.verification_status || "unverified", json(b.important_dates), json(b.application_fee),
        json(b.age_limit), json(b.vacancy_details), b.qualification || null,
        b.selection_process || null, b.how_to_apply || null, json(b.important_links),
        json(b.faqs), b.notice_text || null, b.seo_title || null, b.seo_description || null,
        b.layout_direction || "row", Number(b.layout_columns) || 2,
        b.theme_primary || "#173f70", b.theme_accent || "#e87920",
        b.theme_background || "#ffffff", b.theme_text || "#182638",
        b.image_url || null, b.image_title || null, json(b.custom_tables),
        b.status || "draft", id,
      ]
    );

    await connection.execute("DELETE FROM post_categories WHERE post_id=?", [id]);
    await connection.query(
      "INSERT INTO post_categories (post_id,category_id) VALUES ?",
      [categoryIds.map((categoryId: number) => [Number(id), categoryId])]
    );
    await connection.commit();
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (connection) await connection.rollback();
    return NextResponse.json(
      { error: error.message === "UNAUTHORIZED" ? "Please sign in." : "Could not update post." },
      { status: error.message === "UNAUTHORIZED" ? 401 : 400 }
    );
  } finally {
    connection?.release();
  }
}
