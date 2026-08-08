"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { callApi } from "@/components/app/api-client";
import Breadcrumbs from "@/components/app/breadcrumbs";
import LoadingButton from "@/components/app/loading-button";
import { ToastViewport, useToasts } from "@/components/app/toasts";
import type { ApiDocument } from "@/components/app/types";

const today = new Date().toISOString().slice(0, 10);

export default function NewDocumentPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const { dismissToast, showToast, toasts } = useToasts();

  async function createDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    const form = new FormData(event.currentTarget);

    try {
      const body = await callApi<{ document: ApiDocument }>("/api/documents", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          customer: form.get("customer"),
          issueDate: form.get("issueDate")
        })
      });
      router.push(`/documents/${body.document.id}`);
    } catch (apiError) {
      showToast(apiError instanceof Error ? apiError.message : "Could not create document", "error");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <ToastViewport dismissToast={dismissToast} toasts={toasts} />
      <Breadcrumbs items={[{ label: "Documents", href: "/documents" }, { label: "New document" }]} />
      <header className="page-header">
        <div>
          <p className="eyebrow">New document</p>
          <h1>Create a draft</h1>
          <p>Start with metadata, then add line items on the document detail page.</p>
        </div>
      </header>

      <form className="panel form-grid content-panel" onSubmit={createDocument}>
          <h2>Document details</h2>
          <div className="field-row">
            <label>
              Title
              <input name="title" required placeholder="August implementation services" />
            </label>
            <label>
              Customer
              <input name="customer" required placeholder="Acme Co." />
            </label>
            <label>
              Issue date
              <input name="issueDate" required type="date" defaultValue={today} />
            </label>
          </div>
          <label>
            Description
            <textarea name="description" maxLength={500} placeholder="Short internal summary or scope for this document." />
          </label>
          <div className="actions">
            <LoadingButton type="submit" loading={isCreating}>
              Create draft
            </LoadingButton>
          </div>
      </form>
    </>
  );
}
