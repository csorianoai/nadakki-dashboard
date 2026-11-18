import LeadForm from './LeadForm';
import { t as tt, getZones } from '../lib/content';
import { path } from '../lib/routes';
import { wa } from './Shell';

const KEYS = ['form_iam', 'intent_buyer', 'intent_seller', 'intent_tenant', 'f_name', 'f_email', 'f_phone', 'f_area', 'f_address', 'f_building', 'f_ptype', 'f_goal', 'f_rent', 'f_move', 'f_timeline', 'f_payment', 'f_country', 'f_date', 'f_time', 'f_topic', 'f_channel', 'consent', 'form_note', 'submit_buyer', 'submit_seller', 'submit_tenant', 'submit_consult', 'submit_property', 'f_message', 'f_first', 'f_lastname','submit_alerts', 'submit_market', 'submit_saved', 'next', 'back', 'step', 'of', 'step_property', 'step_goal', 'step_contact', 'sending', 'need_contact', 'send_error', 'thanks', 'thanks_text', 'write_whatsapp', 'nav_privacy'];

// Server wrapper: passes only the strings and options the client form needs.
export default function Lead({ lang, mode = 'buyer', chooser, id, hidden, waText }) {
  const t = tt(lang);
  const s = Object.fromEntries(KEYS.map((k) => [k, t[k]]));
  s.form_label = lang === 'es' ? 'Formulario de contacto' : 'Contact form';
  const es = lang === 'es';
  const times = [];
  for (let h = 9; h <= 18; h++) times.push(`${h <= 12 ? h : h - 12}:00 ${h < 12 ? 'AM' : 'PM'}`);
  const o = {
    zones: [es ? 'Cualquier zona' : 'Any area', ...getZones().map((z) => (es ? z.name : z.nameEn || z.name)), 'Punta Cana (RD)'],
    timeline: [t.tl_now, t.tl_6, t.tl_12, t.tl_explore],
    payment: [t.pay_cash, t.pay_foreign, t.pay_local, t.not_sure],
    ptype: [t.type_condo, t.type_house, t.type_penthouse, t.other],
    goal: [t.goal_sell, t.goal_rent, t.goal_both, t.goal_value],
    rent: es ? ['Hasta $5.000', '$5.000 – $10.000', '$10.000 – $20.000', '$20.000 +'] : ['Up to $5,000', '$5,000 – $10,000', '$10,000 – $20,000', '$20,000 +'],
    times,
    topics: [t.intent_buyer, t.intent_seller, t.intent_tenant, t.nav_international],
    channels: ['Email', 'WhatsApp']
  };
  return <LeadForm lang={lang} mode={mode} chooser={chooser} id={id} s={s} o={o} waLink={wa(lang, waText)} privacyHref={path(lang, 'privacy')} hidden={hidden} />;
}
