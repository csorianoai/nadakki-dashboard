import {
  catalogForDepartment,
  type NautaBundlePlan,
  type NautaCatalogEntry,
} from "@/lib/nauta/catalogMeta";
import { DEPT_NAMES } from "@/lib/nauta/strings";
import { formatDop } from "@/lib/nauta/format";
import { S } from "@/lib/nauta/strings";

export function BundleCard({ plan }: { plan: NautaBundlePlan }) {
  const roles = catalogForDepartment(plan.department_id);
  const deptCode = plan.department_id.toUpperCase();
  const deptName = DEPT_NAMES[plan.department_id] ?? plan.department_id;
  const count = roles.length;

  return (
    <div className={`plan${plan.featured ? " feat" : ""}`}>
      {plan.featured ? <div className="ptag">{S.bundle.starTag}</div> : null}
      <div className="ph">
        <div className="dc">{S.bundle.deptPrefix(deptCode)}</div>
        <h3>{deptName}</h3>
        <div className="sub">{S.bundle.nDigital(count)}</div>
      </div>
      <div className="price">
        <span className="n num">{formatDop(plan.price_dop)}</span>
        <span className="u">{S.bundle.perMonth}</span>
      </div>
      <div className="vs">
        {plan.featured ? (
          <>
            <b>{plan.value_anchor.split(" — ")[0]}</b>
            {plan.value_anchor.includes(" — ") ? ` — ${plan.value_anchor.split(" — ").slice(1).join(" — ")}` : ""}
          </>
        ) : (
          plan.value_anchor
        )}
      </div>
      <div className="roles">
        {roles.map((r) => (
          <RoleRow key={r.role_id} role={r} featured={plan.featured && r.is_star} />
        ))}
      </div>
      <div className="save">{plan.save_line}</div>
      <button type="button" className="btn primary">
        {S.bundle.hireDept}
      </button>
    </div>
  );
}

function RoleRow({ role, featured }: { role: NautaCatalogEntry; featured?: boolean }) {
  if (featured && role.is_star) {
    return (
      <div className="rr" style={{ alignItems: "flex-start" }}>
        <span className="rc plan-star-rc">{role.role_id}</span>
        <div>
          <div className="plan-star-role">◆ {role.role_name}</div>
          <div className="plan-star-sub">{S.bundle.e2Value}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="rr">
      <span className="rc">{role.role_id}</span>
      {role.role_name}
    </div>
  );
}
