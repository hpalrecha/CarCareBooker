import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Plus, Edit, Pause, Play, AlertCircle, Megaphone } from "lucide-react";
import { istLocalToInstant, instantToIstLocal, formatIst, browserIsOutsideIst, IST_LABEL } from "@/lib/ist-time";

/**
 * Admin → Campaigns.
 *
 * A contained panel over the Phase 2A API. It does not introduce a second campaign
 * concept, a second set of validation rules, or a second source of truth for state.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * TWO RULES THIS SCREEN OBEYS, BOTH DELIBERATE.
 *
 * 1. THERE IS NO PRICING HERE. No price field, no discount, no percentage, no category
 *    mapping. A campaign controls whether the BOOKING FEE is waived; services.price
 *    remains the only authority on what the work costs. A price input on this form would
 *    create a second authority on money, which is the failure the whole amount-resolution
 *    design exists to prevent.
 *
 * 2. STATE COMES FROM THE SERVER. Every row renders the `state` the API computed
 *    (running / scheduled / expired / paused / invalid). Recomputing it here from
 *    startsAt/endsAt would duplicate the window rules — the half-open interval,
 *    paused-is-a-draft, invalid-fails-closed — in a second language, and the two would
 *    drift the first time either changed.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * Times are Asia/Kolkata throughout. See lib/ist-time.ts for why the conversion is
 * explicit rather than left to the browser.
 */

const LANDING_PAGES = ["/ceramic-coating/car", "/ceramic-coating/bike", "/ppf"] as const;

interface Campaign {
  id: string;
  name: string;
  identifier: string;
  serviceSlug: string;
  vehicleType: "car" | "bike" | "both";
  landingPage: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  offerType: "free_booking" | "none";
  offerTitle: string;
  offerDescription: string | null;
  ctaText: string;
  /** Computed server-side. Never derived here — see rule 2 above. */
  state: "running" | "scheduled" | "expired" | "paused" | "invalid";
}

interface ServiceRow {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
}

/** Empty form, matching what the API validates. Note: no price field, by design. */
const emptyForm = {
  name: "",
  identifier: "",
  serviceSlug: "",
  vehicleType: "car" as Campaign["vehicleType"],
  landingPage: "/ceramic-coating/car" as string,
  startsAtLocal: "",
  endsAtLocal: "",
  isActive: true,
  offerType: "free_booking" as Campaign["offerType"],
  offerTitle: "",
  offerDescription: "",
  ctaText: "Book Free Appointment",
};

type FormState = typeof emptyForm;

/**
 * The API's structured error, unwrapped.
 *
 * `apiRequest` throws `new Error("409: <raw body>")`, which would put a JSON blob in a
 * toast. The server returns field-keyed errors AND, for an overlap, the conflicting
 * campaigns by name — the whole point of which is that the admin is told WHICH campaign
 * is in the way rather than "something went wrong".
 */
async function postCampaign(method: "POST" | "PATCH", url: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (res.ok) return res.json();

  let parsed: any = null;
  try {
    parsed = await res.json();
  } catch {
    /* non-JSON error body */
  }
  const err: any = new Error(parsed?.message || `Request failed (${res.status})`);
  err.status = res.status;
  err.fieldErrors = parsed?.fieldErrors ?? {};
  err.conflicts = parsed?.conflicts ?? [];
  throw err;
}

const STATE_STYLES: Record<Campaign["state"], { label: string; className: string }> = {
  running: { label: "ACTIVE", className: "bg-green-900 text-green-300" },
  scheduled: { label: "SCHEDULED", className: "bg-blue-900 text-blue-300" },
  paused: { label: "PAUSED / DRAFT", className: "bg-gray-700 text-gray-300" },
  expired: { label: "EXPIRED", className: "bg-yellow-900 text-yellow-300" },
  invalid: { label: "INVALID", className: "bg-red-900 text-red-300" },
};

export default function AdminCampaigns() {
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** Campaign awaiting an explicit activation confirmation. See the summary dialog below. */
  const [confirming, setConfirming] = useState<Campaign | null>(null);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns"],
  });

  const { data: services = [] } = useQuery<ServiceRow[]>({
    queryKey: ["/api/services"],
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setForm({
      name: c.name,
      identifier: c.identifier,
      serviceSlug: c.serviceSlug,
      vehicleType: c.vehicleType,
      landingPage: c.landingPage,
      // Rendered AS IST, not as the browser's local time.
      startsAtLocal: instantToIstLocal(c.startsAt),
      endsAtLocal: instantToIstLocal(c.endsAt),
      isActive: c.isActive,
      offerType: c.offerType,
      offerTitle: c.offerTitle,
      offerDescription: c.offerDescription ?? "",
      ctaText: c.ctaText,
    });
    setFieldErrors({});
    setFormOpen(true);
  };

  /** Report a failed mutation: field errors onto the fields, conflicts by NAME. */
  const reportError = (err: any) => {
    setFieldErrors(err?.fieldErrors ?? {});
    const conflicts: { name: string; identifier: string }[] = err?.conflicts ?? [];
    toast({
      title: conflicts.length ? "Conflicts with another campaign" : "Could not save campaign",
      description: conflicts.length
        ? // Naming the campaign in the way is the entire point: the admin can go and pause
          // it. Nothing is deactivated automatically on their behalf.
          `Already running on this landing page: ${conflicts
            .map((c) => `"${c.name}" (${c.identifier})`)
            .join(", ")}. Pause it or change the dates — nothing was changed.`
        : err?.message || "Please check the highlighted fields.",
      variant: "destructive",
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string; body: Record<string, unknown> }) =>
      payload.id
        ? postCampaign("PATCH", `/api/admin/campaigns/${payload.id}`, payload.body)
        : postCampaign("POST", "/api/admin/campaigns", payload.body),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setFormOpen(false);
      setFieldErrors({});
      toast({
        title: vars.id ? "Campaign updated" : "Campaign created",
        description: "Existing bookings keep the campaign they were taken under.",
      });
    },
    onError: reportError,
  });

  /** Pause / activate. Sends ONLY isActive — the server re-validates the merged record. */
  const toggleMutation = useMutation({
    mutationFn: async (c: Campaign) =>
      postCampaign("PATCH", `/api/admin/campaigns/${c.id}`, { isActive: !c.isActive }),
    onSuccess: (_data, c) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setConfirming(null);
      toast({
        title: c.isActive ? "Campaign paused" : "Campaign activated",
        description: c.isActive
          ? "Customers no longer see this offer. Bookings already taken keep their attribution."
          : "The offer is live on its landing page.",
      });
    },
    onError: (err) => {
      setConfirming(null);
      reportError(err);
    },
  });

  const submit = () => {
    setFieldErrors({});

    // Friendly client-side checks. The SERVER remains authoritative — these only save a
    // round trip on the two mistakes that are easiest to make.
    const startsAt = istLocalToInstant(form.startsAtLocal);
    const endsAt = istLocalToInstant(form.endsAtLocal);
    const local: Record<string, string> = {};
    if (!startsAt) local.startsAt = "Enter a start date and time";
    if (!endsAt) local.endsAt = "Enter an end date and time";
    if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
      local.endsAt = "End must be after start";
    }
    if (Object.keys(local).length) {
      setFieldErrors(local);
      return;
    }

    saveMutation.mutate({
      id: editing?.id,
      body: {
        name: form.name.trim(),
        identifier: form.identifier.trim(),
        serviceSlug: form.serviceSlug,
        vehicleType: form.vehicleType,
        landingPage: form.landingPage,
        startsAt,
        endsAt,
        isActive: form.isActive,
        offerType: form.offerType,
        offerTitle: form.offerTitle.trim(),
        offerDescription: form.offerDescription.trim() || null,
        ctaText: form.ctaText.trim(),
      },
    });
  };

  const serviceTitle = (slug: string) =>
    services.find((s) => s.slug === slug)?.title?.trim() || slug;

  const err = (field: string) =>
    fieldErrors[field] ? (
      <p className="text-xs text-red-400 mt-1" data-testid={`error-${field}`}>
        {fieldErrors[field]}
      </p>
    ) : null;

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-medium-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-neon-green flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Campaigns
          </CardTitle>
          <Button
            onClick={openCreate}
            className="bg-neon-green text-deep-black hover:bg-neon-green/90"
            data-testid="button-new-campaign"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-gray-400 mb-4">
            A campaign controls the <strong>booking offer</strong> shown on a landing page — not the
            price of the work. Service prices always come from the services catalogue.
            {browserIsOutsideIst() && (
              <>
                {" "}
                <span className="text-yellow-400" data-testid="text-tz-warning">
                  Your device is not on {IST_LABEL}; all times below are shown and entered in IST.
                </span>
              </>
            )}
          </p>

          {isLoading ? (
            <p className="text-gray-400">Loading campaigns…</p>
          ) : campaigns.length === 0 ? (
            <p className="text-gray-400" data-testid="text-no-campaigns">
              No campaigns yet. The site falls back to the legacy free-booking setting until one is
              created.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-campaigns">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Landing page</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead>Starts (IST)</TableHead>
                    <TableHead>Ends (IST)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const style = STATE_STYLES[c.state] ?? STATE_STYLES.invalid;
                    return (
                      <TableRow key={c.id} data-testid={`row-campaign-${c.identifier}`}>
                        <TableCell>
                          <Badge className={style.className} data-testid={`state-${c.identifier}`}>
                            {style.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-white">{c.name}</div>
                          <code className="text-xs text-gray-400">{c.identifier}</code>
                        </TableCell>
                        <TableCell className="text-gray-300">{serviceTitle(c.serviceSlug)}</TableCell>
                        <TableCell className="text-gray-300 capitalize">{c.vehicleType}</TableCell>
                        <TableCell>
                          <code className="text-xs text-gray-300">{c.landingPage}</code>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {c.offerType === "free_booking" ? "Free booking" : "Display only"}
                        </TableCell>
                        <TableCell className="text-gray-300 text-xs">{formatIst(c.startsAt)}</TableCell>
                        <TableCell className="text-gray-300 text-xs">{formatIst(c.endsAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(c)}
                              data-testid={`button-edit-${c.identifier}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              // Activation goes through a confirmation summary; pausing is
                              // immediately reversible and does not need one.
                              onClick={() => (c.isActive ? toggleMutation.mutate(c) : setConfirming(c))}
                              disabled={toggleMutation.isPending}
                              data-testid={`button-toggle-${c.identifier}`}
                            >
                              {c.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- create / edit ---------------- */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-dark-gray border-medium-gray max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-neon-green">
              {editing ? "Edit campaign" : "New campaign"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Times are {IST_LABEL}. This form sets the offer only — the service price comes from the
              catalogue and cannot be changed here.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Campaign name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="September Ceramic Car"
                  data-testid="input-campaign-name"
                />
                {err("name")}
              </div>
              <div>
                <Label className="text-white">Identifier</Label>
                <Input
                  value={form.identifier}
                  onChange={(e) => set("identifier", e.target.value)}
                  placeholder="ceramic_car_sep"
                  data-testid="input-campaign-identifier"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase, digits and underscores. Use the same value as the ad's{" "}
                  <code>utm_campaign</code> so bookings can be matched to the advertisement.
                </p>
                {err("identifier")}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Service</Label>
                <Select value={form.serviceSlug} onValueChange={(v) => set("serviceSlug", v)}>
                  <SelectTrigger data-testid="select-campaign-service">
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter((s) => s.isActive !== false)
                      .map((s) => (
                        <SelectItem key={s.slug} value={s.slug}>
                          {s.title.trim()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  The offer applies to this service only.
                </p>
                {err("serviceSlug")}
              </div>
              <div>
                <Label className="text-white">Vehicle type</Label>
                <Select value={form.vehicleType} onValueChange={(v) => set("vehicleType", v as any)}>
                  <SelectTrigger data-testid="select-campaign-vehicle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
                {err("vehicleType")}
              </div>
            </div>

            <div>
              <Label className="text-white">Landing page</Label>
              <Select value={form.landingPage} onValueChange={(v) => set("landingPage", v)}>
                <SelectTrigger data-testid="select-campaign-landing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* A closed list. A campaign pointed at a route that does not exist would be
                      invisible and look like a broken offer, so arbitrary URLs are not accepted
                      here — and the server enforces the same list. */}
                  {LANDING_PAGES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("landingPage")}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Starts ({IST_LABEL})</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAtLocal}
                  onChange={(e) => set("startsAtLocal", e.target.value)}
                  data-testid="input-campaign-starts"
                />
                {err("startsAt")}
              </div>
              <div>
                <Label className="text-white">Ends ({IST_LABEL})</Label>
                <Input
                  type="datetime-local"
                  value={form.endsAtLocal}
                  onChange={(e) => set("endsAtLocal", e.target.value)}
                  data-testid="input-campaign-ends"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The offer ends AT this moment. To run through the 16th, set 17 Sep 00:00.
                </p>
                {err("endsAt")}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Offer type</Label>
                <Select value={form.offerType} onValueChange={(v) => set("offerType", v as any)}>
                  <SelectTrigger data-testid="select-campaign-offer-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free_booking">Free booking (waives the booking fee)</SelectItem>
                    <SelectItem value="none">Display only (no change to charges)</SelectItem>
                  </SelectContent>
                </Select>
                {err("offerType")}
              </div>
              <div>
                <Label className="text-white">CTA button text</Label>
                <Input
                  value={form.ctaText}
                  onChange={(e) => set("ctaText", e.target.value)}
                  maxLength={40}
                  data-testid="input-campaign-cta"
                />
                {err("ctaText")}
              </div>
            </div>

            <div>
              <Label className="text-white">Offer title</Label>
              <Input
                value={form.offerTitle}
                onChange={(e) => set("offerTitle", e.target.value)}
                placeholder="Booking Is Free This Week"
                data-testid="input-campaign-offer-title"
              />
              <p className="text-xs text-gray-500 mt-1">
                Shown above the countdown. The page always states the service price beside it, so
                this must not suggest the service itself is free.
              </p>
              {err("offerTitle")}
            </div>

            <div>
              <Label className="text-white">Offer description (optional)</Label>
              <Textarea
                value={form.offerDescription}
                onChange={(e) => set("offerDescription", e.target.value)}
                rows={2}
                data-testid="input-campaign-offer-description"
              />
              {err("offerDescription")}
            </div>

            <div className="flex items-center gap-3">
              <input
                id="campaign-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set("isActive", e.target.checked)}
                data-testid="input-campaign-active"
              />
              <Label htmlFor="campaign-active" className="text-white">
                Active
              </Label>
              <span className="text-xs text-gray-500">
                Leave unchecked to save as a draft. Drafts are invisible to customers and may
                overlap other campaigns.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} data-testid="button-campaign-cancel">
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={saveMutation.isPending}
              className="bg-neon-green text-deep-black hover:bg-neon-green/90"
              data-testid="button-campaign-save"
            >
              {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Create campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- activation summary ----------------
          An admin should know exactly what is about to become visible to customers BEFORE
          it does. This restates the campaign in plain terms and activates nothing until
          confirmed — and if the server then reports a conflict, nothing is changed and the
          conflicting campaign is named. */}
      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent className="bg-dark-gray border-medium-gray">
          <DialogHeader>
            <DialogTitle className="text-neon-green flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Activate this campaign?
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This offer becomes visible to customers on its landing page.
            </DialogDescription>
          </DialogHeader>

          {confirming && (
            <dl className="text-sm space-y-2" data-testid="summary-activation">
              {[
                ["Campaign", confirming.name],
                ["Identifier", confirming.identifier],
                ["Service", serviceTitle(confirming.serviceSlug)],
                ["Vehicle", confirming.vehicleType],
                ["Landing page", confirming.landingPage],
                ["Offer", confirming.offerType === "free_booking" ? "Booking fee waived" : "Display only"],
                ["Starts", formatIst(confirming.startsAt)],
                ["Ends", formatIst(confirming.endsAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-medium-gray/50 pb-1">
                  <dt className="text-gray-400">{label}</dt>
                  <dd className="text-white text-right">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="text-xs text-gray-500">
            The service price is unchanged — only the booking fee is affected, and only for the
            service above.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)} data-testid="button-activate-cancel">
              Cancel
            </Button>
            <Button
              onClick={() => confirming && toggleMutation.mutate(confirming)}
              disabled={toggleMutation.isPending}
              className="bg-neon-green text-deep-black hover:bg-neon-green/90"
              data-testid="button-activate-confirm"
            >
              {toggleMutation.isPending ? "Activating…" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
