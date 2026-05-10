"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  CheckCircle2,
  Home,
  Inbox,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import {
  AuditTimeline,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  ConsentCapture,
  DataTable,
  type DataTableDensity,
  type DataTableSortDirection,
  DateInput,
  Drawer,
  EmptyState,
  EvidenceCard,
  ForgeToaster,
  IconButton,
  Input,
  KpiCard,
  Modal,
  MoneyInput,
  RadioGroup,
  Select,
  Sidebar,
  Skeleton,
  StatusPill,
  Switch,
  Tabs,
  Textarea,
  toast,
  Topbar,
  useForgeCommandPalette,
} from "@/components/forge";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="scroll-mt-4 border-b border-forgeGray-100 py-10 last:border-0">
      <h2 className="mb-6 font-display text-forge-md font-semibold text-forgeGray-800">{title}</h2>
      {children}
    </section>
  );
}

type DemoRow = { id: string; applicant: string; channel: string };

export default function ForgePreviewPage() {
  const { toggle: openCommandPalette } = useForgeCommandPalette();
  const [tabLine, setTabLine] = useState("one");
  const [tabPills, setTabPills] = useState("a");
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sw, setSw] = useState(false);
  const [cb, setCb] = useState(true);
  const [radio, setRadio] = useState("b");
  const [money, setMoney] = useState(1250.5);
  const [date, setDate] = useState("2026-04-29");
  const [consent, setConsent] = useState(false);
  const [select, setSelect] = useState("usd");
  const [tableDensity, setTableDensity] = useState<DataTableDensity>("compact");
  const [tableSort, setTableSort] = useState<DataTableSortDirection>("none");
  const [tableDemo, setTableDemo] = useState<"data" | "loading" | "empty">("data");
  const [bulkDemoSelected, setBulkDemoSelected] = useState<string[]>(["1"]);

  const tableRows: DemoRow[] = useMemo(
    () => [
      { id: "1", applicant: "Rivera, A.", channel: "Branch" },
      { id: "2", applicant: "Nguyen, T.", channel: "Online" },
    ],
    []
  );

  const tableColumns = useMemo(
    () => [
      {
        id: "applicant",
        header: "Applicant",
        sort: tableSort,
        onSort: () => {
          setTableSort((s) => (s === "none" ? "ascending" : s === "ascending" ? "descending" : "none"));
        },
        cell: (r: DemoRow) => r.applicant,
      },
      { id: "channel", header: "Channel", cell: (r: DemoRow) => r.channel },
      {
        id: "status",
        header: "Status",
        cell: () => <StatusPill tone="info">In review</StatusPill>,
      },
    ],
    [tableSort]
  );

  return (
    <div className="min-h-screen bg-forgeSurface-page pb-24 text-forgeGray-800">
      <ForgeToaster />
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm action"
        description="Modals use the native dialog element with token-backed surfaces."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Continue
            </Button>
          </div>
        }
      >
        <p className="text-forge-sm text-forgeGray-600">Body content uses the same typography scale as production screens.</p>
      </Modal>
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        description="Drawer panel for secondary workflows."
        footer={<Button fullWidth onClick={() => setDrawerOpen(false)}>Apply</Button>}
      >
        <p className="text-forge-sm text-forgeGray-600">Filter controls would live here.</p>
      </Drawer>

      <div className="mx-auto max-w-5xl px-4 pt-8">
        <Breadcrumb
          items={[
            { label: "Credit Hub", href: "/credit-hub" },
            { label: "Design", href: "/credit-hub/preview" },
            { label: "Forge preview" },
          ]}
        />
        <h1
          className="mt-4 font-display font-normal leading-[1.1] tracking-[-0.015em] text-forgeGray-800"
          style={{ fontSize: "clamp(48px, 6vw, 64px)" }}
        >
          Forge component preview
        </h1>
        <p className="mt-2 font-sans text-forge-sm text-forgeGray-600">Multi-tenant credit origination UI · v1.0.0</p>
        <p className="mt-2 max-w-2xl text-forge-xs text-forgeGray-500">
          Phase 2 playground — v3.2 tokens. Command palette:{" "}
          <kbd className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-1 font-forgeMono text-forge-xs">
            Ctrl K
          </kbd>
          .
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-6xl px-4">
        <Card variant="inset" className="overflow-hidden p-0">
          <div className="flex min-h-[420px] flex-col md:flex-row">
            <Sidebar
              brand={<span className="font-display text-forge-sm font-semibold text-forgeBrand-700">Forge</span>}
              items={[
                { id: "h", label: "Home", href: "#layout", icon: <Home aria-hidden />, active: true },
                { id: "d", label: "Dashboard", href: "#layout", icon: <LayoutDashboard aria-hidden /> },
                { id: "s", label: "Settings", href: "#layout", icon: <Settings aria-hidden /> },
              ]}
              footer={<span className="text-forge-xs text-forgeGray-500">Layout preview</span>}
            />
            <div className="flex min-w-0 flex-1 flex-col bg-forgeSurface-page">
              <Topbar
                leading={
                  <Breadcrumb
                    items={[
                      { label: "Bank", href: "#" },
                      { label: "Applications" },
                    ]}
                  />
                }
                title="Application queue"
                actions={
                  <>
                    <IconButton aria-label="Notifications" variant="default">
                      <Bell className="h-4 w-4" aria-hidden />
                    </IconButton>
                    <Button size="sm" variant="primary" onClick={() => toast.success("Saved")}>
                      Save
                    </Button>
                  </>
                }
              />
              <div className="flex-1 space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <KpiCard
                    icon={Inbox}
                    label="Open"
                    value="128"
                    trend={{ direction: "up", value: "+4.2%", label: "vs prior week" }}
                    hint="Rolling 7-day window"
                  />
                  <KpiCard icon={Bell} label="SLA risk" value="6" hint="2 escalated" />
                  <KpiCard icon={CheckCircle2} label="Auto-decision" value="42%" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <Section title="Buttons & icon buttons">
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">Variants (default)</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="link">Link</Button>
                <Button variant="primary" leadingIcon={<Plus className="h-4 w-4" aria-hidden />}>
                  With leading icon
                </Button>
                <Button variant="primary" trailingIcon={<Sparkles className="h-4 w-4" aria-hidden />}>
                  With trailing icon
                </Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">Loading (leading spinner, label visible)</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" loading>
                  Primary
                </Button>
                <Button variant="secondary" loading>
                  Secondary
                </Button>
                <Button variant="ghost" loading>
                  Ghost
                </Button>
                <Button variant="danger" loading>
                  Danger
                </Button>
                <Button variant="link" loading>
                  Link
                </Button>
                <Button variant="primary" loading leadingIcon={<Plus className="h-4 w-4" aria-hidden />}>
                  Icon hidden while loading
                </Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">Disabled (no hover lift)</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" disabled>
                  Primary
                </Button>
                <Button variant="secondary" disabled>
                  Secondary
                </Button>
                <Button variant="ghost" disabled>
                  Ghost
                </Button>
                <Button variant="danger" disabled>
                  Danger
                </Button>
                <Button variant="link" disabled>
                  Link
                </Button>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">IconButton</h3>
              <div className="flex flex-wrap items-center gap-3">
                <IconButton aria-label="User" variant="default">
                  <User className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton aria-label="Sparkle" variant="subtle">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton aria-label="Disabled default" variant="default" disabled>
                  <Bell className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton aria-label="Disabled subtle" variant="subtle" disabled>
                  <Settings className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
                Focus on surfaces (Tab through — brand-500 ring)
              </h3>
              <p className="mb-3 max-w-2xl text-forge-xs text-forgeGray-500">
                Light card, deep brand header, and modal scrim tint — primary/secondary/icon controls should keep a visible focus outline.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card p-4">
                  <p className="mb-3 text-forge-xs text-forgeGray-500">Card surface</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="primary">
                      Primary
                    </Button>
                    <Button size="sm" variant="secondary">
                      Secondary
                    </Button>
                    <IconButton aria-label="Bell on card" variant="default">
                      <Bell className="h-4 w-4" aria-hidden />
                    </IconButton>
                  </div>
                </div>
                <div className="rounded-forge-sm bg-forgeBrand-900 p-4">
                  <p className="mb-3 text-forge-xs text-forgeGray-200">Brand-900 header</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="primary">
                      Primary
                    </Button>
                    <IconButton aria-label="Bell on navy" variant="default" className="border-forgeGray-600 bg-forgeBrand-800 text-forgeGray-50 hover:bg-forgeBrand-700">
                      <Bell className="h-4 w-4" aria-hidden />
                    </IconButton>
                  </div>
                </div>
                <div
                  className="rounded-forge-sm p-4"
                  style={{ backgroundColor: "rgba(15, 23, 41, 0.48)" }}
                >
                  <p className="mb-3 text-forge-xs text-forgeGray-100">Modal scrim (rgba 15,23,41,0.48)</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="primary">
                      Primary
                    </Button>
                    <Button size="sm" variant="secondary">
                      Secondary
                    </Button>
                    <IconButton aria-label="Bell on scrim" variant="default">
                      <Bell className="h-4 w-4" aria-hidden />
                    </IconButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="max-w-xl space-y-6">
              <h3 className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">Default</h3>
              <Input name="legal-name" label="Legal name" placeholder="Ada Lovelace" />
              <Textarea name="preview-notes" label="Notes" placeholder="Internal notes…" rows={3} />
              <Select
                name="currency"
                label="Currency"
                value={select}
                onChange={(e) => setSelect(e.target.value)}
                options={[
                  { value: "usd", label: "USD" },
                  { value: "eur", label: "EUR" },
                ]}
              />
              <MoneyInput label="Loan amount" value={money} onValueChange={setMoney} locale="en-US" currency="USD" hint="Major units" />
              <DateInput label="Closing date" value={date} onValueChange={setDate} locale="en-US" hint="ISO field with localized preview" />
              <Checkbox label="Agree to hard pull" checked={cb} onChange={(e) => setCb(e.target.checked)} />
              <RadioGroup
                name="rg-preview"
                label="Channel"
                layout="inline"
                value={radio}
                onChange={setRadio}
                options={[
                  { value: "a", label: "Branch" },
                  { value: "b", label: "Online" },
                  { value: "c", label: "Partner", disabled: true },
                ]}
              />
              <Switch checked={sw} onCheckedChange={setSw} label="Desktop notifications" />
            </div>
            <div className="max-w-xl space-y-6">
              <h3 className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">Disabled &amp; error</h3>
              <Input
                name="preview-legal-err"
                label="Client name"
                defaultValue="A"
                error="Enter at least two characters."
              />
              <Input name="preview-legal-dis" label="Locked field" defaultValue="Read-only value" disabled />
              <Textarea name="preview-notes-err" label="Reason" defaultValue="" error="A reason is required for this action." rows={2} />
              <Textarea name="preview-notes-dis" label="Archived notes" defaultValue="Cannot edit in this state." disabled rows={2} />
              <Select
                name="currency-dis"
                label="Currency (locked)"
                value="usd"
                disabled
                onChange={() => {}}
                options={[
                  { value: "usd", label: "USD" },
                  { value: "eur", label: "EUR" },
                ]}
              />
              <MoneyInput
                label="Amount over limit"
                value={money}
                onValueChange={setMoney}
                locale="en-US"
                currency="USD"
                error="Requested amount exceeds policy maximum."
              />
              <MoneyInput label="Prior balance" value={0} onValueChange={() => {}} locale="en-US" currency="USD" disabled hint="Synced from core" />
              <DateInput
                label="Funding date"
                value={date}
                onValueChange={setDate}
                locale="en-US"
                error="Date must fall within the current disclosure window."
              />
              <DateInput label="Booked on" value="2026-01-15" onValueChange={() => {}} locale="en-US" disabled />
              <Checkbox label="Immutable consent flag" checked disabled onChange={() => {}} />
              <Switch checked={false} onCheckedChange={() => {}} label="Tenant-locked feature" disabled />
            </div>
          </div>
        </Section>

        <Section title="Consent capture">
          <ConsentCapture
            checked={consent}
            onCheckedChange={setConsent}
            consentAriaLabel="Accept terms and privacy notice"
          >
            <p>
              I authorize the institution to verify information provided and to obtain a consumer report. See linked terms
              for retention and dispute rights.
            </p>
          </ConsentCapture>
        </Section>

        <Section title="Cards, empty state, badges">
          <div className="grid gap-4 md:grid-cols-2">
            <Card variant="default">
              <p className="text-forge-sm font-medium text-forgeGray-800">Default card</p>
              <p className="mt-2 text-forge-sm text-forgeGray-600">Shadow-xs, raised surface.</p>
            </Card>
            <Card variant="outlined">
              <p className="text-forge-sm font-medium text-forgeGray-800">Outlined</p>
              <p className="mt-2 text-forge-sm text-forgeGray-600">No elevation — dense stacks.</p>
            </Card>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">EmptyState — default + CTA</p>
              <EmptyState
                icon={<Inbox />}
                title="No applications match these filters"
                description="Clear filters or widen your search to see the full queue."
                action={<Button variant="secondary">Clear all filters</Button>}
              />
            </div>
            <div>
              <p className="mb-2 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">EmptyState — passive (card context)</p>
              <Card variant="default" className="p-4">
                <EmptyState
                  tone="success"
                  className="border-solid"
                  icon={<CheckCircle2 className="text-forgeSuccess-600" />}
                  title="No open AML/KYC alerts"
                  description="All visible applications meet the minimum controls reviewed."
                />
              </Card>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill tone="success">Approved</StatusPill>
            <StatusPill tone="warning">Review</StatusPill>
            <StatusPill tone="danger">Declined</StatusPill>
            <StatusPill tone="info">Pending</StatusPill>
            <StatusPill tone="neutral">Draft</StatusPill>
          </div>
          <EmptyState
            className="mt-6"
            icon={<Sparkles />}
            title="No applications yet"
            description="When data exists, this region lists recent applications with sortable columns."
            action={<Button variant="primary">Create application</Button>}
          />
        </Section>

        <Section title="Skeleton & avatar">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-12 w-12 rounded-forge-pill" />
            <Avatar alt="Jamie Chen" fallback="JC" size="md" />
            <Avatar alt="Sam Patel" fallback="SP" size="lg" />
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs
            variant="line"
            value={tabLine}
            onValueChange={setTabLine}
            tabs={[
              { id: "one", label: "Summary", panel: <p>Summary panel content.</p> },
              { id: "two", label: "Documents", panel: <p>Documents panel content.</p> },
              { id: "three", label: "Disabled", disabled: true, panel: <p>Hidden</p> },
            ]}
          />
          <div className="mt-8">
            <Tabs
              variant="pills"
              value={tabPills}
              onValueChange={setTabPills}
              tabs={[
                { id: "a", label: "All", panel: <p>All items.</p> },
                { id: "b", label: "Mine", panel: <p>Assigned to me.</p> },
              ]}
            />
          </div>
        </Section>

        <Section title="Data table">
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <div className="min-w-[12rem] max-w-xs flex-1">
              <Select
                name="preview-table-demo"
                label="Preview mode"
                value={tableDemo}
                onChange={(e) => setTableDemo(e.target.value as "data" | "loading" | "empty")}
                options={[
                  { value: "data", label: "With rows" },
                  { value: "loading", label: "Loading skeleton" },
                  { value: "empty", label: "Empty (EmptyState)" },
                ]}
              />
            </div>
            <div className="min-w-[12rem] max-w-xs flex-1">
              <Select
                name="preview-table-density"
                label="Density"
                value={tableDensity}
                onChange={(e) => setTableDensity(e.target.value as DataTableDensity)}
                options={[
                  { value: "comfortable", label: "Comfortable" },
                  { value: "compact", label: "Compact" },
                  { value: "dense", label: "Dense" },
                ]}
              />
            </div>
          </div>
          <DataTable<DemoRow>
            getRowId={(r) => r.id}
            rows={tableDemo === "data" ? tableRows : []}
            columns={tableColumns}
            density={tableDensity}
            loading={tableDemo === "loading"}
            skeletonRowCount={4}
            emptyLabel="No applications in this preview slice"
            emptyDescription="Try switching preview mode to “With rows” or adjust filters in a real screen."
            emptyIcon={<Inbox />}
            emptyAction={
              <Button type="button" variant="secondary" size="sm" onClick={() => setTableDemo("data")}>
                Reset preview to sample rows
              </Button>
            }
          />
          <p className="mt-8 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">DataTable — empty row (success / passive)</p>
          <DataTable<DemoRow>
            getRowId={(r) => r.id}
            rows={[]}
            columns={tableColumns}
            density={tableDensity}
            emptyLabel="No open AML/KYC alerts"
            emptyDescription="Positive framing when the grid has nothing to flag."
            emptyTone="success"
            emptyIcon={<CheckCircle2 className="text-forgeSuccess-600" />}
          />
          <div className="mt-6 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4">
            <p className="mb-3 text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">Bulk action bar (layout only)</p>
            <div className="flex flex-wrap items-center gap-4">
              <Checkbox
                label="Select all demo rows"
                checked={bulkDemoSelected.length === tableRows.length}
                onChange={(e) => setBulkDemoSelected(e.target.checked ? tableRows.map((r) => r.id) : [])}
              />
              <span className="text-forge-sm text-forgeGray-600">
                {bulkDemoSelected.length} selected — uses same tokens as bank queue bulk strip.
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-forgeGray-100 pt-4">
            <p className="text-forge-xs text-forgeGray-500">Pagination (no forge Pagination primitive — button disabled spec)</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled>
                Previous
              </Button>
              <Button size="sm" variant="secondary">
                Next
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Evidence & audit">
          <div className="grid gap-6 md:grid-cols-2">
            <EvidenceCard
              title="Income stability"
              sourceLabel="payroll_v2.normalized"
              confidence="high"
              body={
                <p>
                  Recurring deposits match stated employer with low variance across the trailing six statements.
                </p>
              }
            />
            <div>
              <AuditTimeline
                entries={[
                  {
                    id: "e1",
                    timestampLabel: "Apr 29, 2026 · 09:12",
                    actorLabel: "System",
                    actionLabel: "Risk score computed",
                    detail: "Model v4.2 — no manual override",
                  },
                  {
                    id: "e2",
                    timestampLabel: "Apr 29, 2026 · 09:20",
                    actorLabel: "Analyst",
                    actionLabel: "Assigned to queue",
                  },
                ]}
              />
            </div>
          </div>
        </Section>

        <Section title="Overlays & toast">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Open drawer
            </Button>
            <Button variant="secondary" onClick={() => openCommandPalette()}>
              Open command palette
            </Button>
            <Button variant="primary" onClick={() => toast.message("Heads up", { description: "Details in timeline." })}>
              Toast message
            </Button>
            <Button variant="primary" onClick={() => toast.error("Validation failed", { description: "Check required fields." })}>
              Toast error
            </Button>
          </div>
        </Section>
      </div>
    </div>
  );
}
