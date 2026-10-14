import { fireEvent, render, screen, within, act } from '@testing-library/react';
import { BarraSuite } from '@/components/nav/BarraSuite';
import { getPostLoginRedirectPath } from '@/lib/auth/auth-context';

let auth: any;
jest.mock('@/hooks/useAuth', () => ({useAuth: () => auth}));
jest.mock('next/navigation', () => ({usePathname: () => '/credit-hub/bank-v2/solicitudes'}), {virtual:true});
jest.mock('next/link', () => ({__esModule: true, default: ({href, children, ...rest}: any) => <a href={href} {...rest}>{children}</a>}), {virtual:true});
jest.mock('@/lib/migas', () => ({migasDe: () => [{label:'Inicio',href:'/'},{label:'Banco',href:'/credit-hub/bank-v2'}]}));
// La función de aterrizaje es real; se aíslan sus dependencias de sesión/red.
jest.mock('@/lib/api/auth-v2', () => ({}));
jest.mock('@/lib/auth/token-storage', () => ({}));
jest.mock('@/lib/auth/token-refresh', () => ({}));
jest.mock('@/lib/credit-hub/dealer/wizard-draft-storage', () => ({}));
jest.mock('@/lib/dealer/access-context', () => ({}));

beforeEach(() => {
  auth = {isLoading:false,isAuthenticated:true,allRoles:[]};
  Object.defineProperty(globalThis, 'navigation', {configurable:true,value:undefined});
});
const roles = (...keys: string[]) => keys.map(role_key => ({role_key,core_name:'credit',display_name:role_key}));

test.each([
  ['bank_analyst','/credit-hub/bank-v2'], ['banker','/credit-hub/bank-v2'],
  ['credit_admin','/credit-hub/bank-v2'], ['dealer','/autos/dealer'],
  ['tenant_admin','/'], ['platform_superadmin','/'],
])('Inicio, logo y miga usan aterrizaje existente para %s', (role, expected) => {
  auth.allRoles=roles(role);
  expect(getPostLoginRedirectPath(auth.allRoles)).toBe(expected);
  render(<BarraSuite />);
  expect(screen.getByTestId('barra-suite-inicio')).toHaveAttribute('href',expected);
  expect(screen.getByTestId('barra-suite-logo')).toHaveAttribute('href',expected);
  expect(within(screen.getByTestId('barra-suite-migas')).getByRole('link',{name:'Inicio'})).toHaveAttribute('href',expected);
});

test('prioridad multirol sigue la autoridad de login', () => {
  auth.allRoles=roles('dealer','platform_superadmin');
  render(<BarraSuite />);
  expect(screen.getByTestId('barra-suite-inicio')).toHaveAttribute('href','/');
});

test.each([{isLoading:true,isAuthenticated:true,allRoles:roles('dealer')},
  {isLoading:false,isAuthenticated:false,allRoles:roles('dealer')},
  {isLoading:false,isAuthenticated:true,allRoles:[]},
])('sin sesión/roles confirmados no fabrica destino de inicio: %o', state => {
  auth=state;
  render(<BarraSuite />);
  for(const id of ['barra-suite-logo','barra-suite-inicio']) {
    expect(screen.getByTestId(id)).not.toHaveAttribute('href');
    expect(screen.getByTestId(id)).toHaveAttribute('aria-disabled','true');
  }
  expect(within(screen.getByTestId('barra-suite-migas')).queryByRole('link',{name:'Inicio'})).toBeNull();
});

test('sin Navigation API no habilita botones que pueden salir de la aplicación', () => {
  render(<BarraSuite />);
  expect(screen.getByRole('button',{name:'Atrás'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Adelante'})).toBeDisabled();
});

test('Navigation API incompleta no concede atrás con una medición parcial', () => {
  Object.defineProperty(globalThis,'navigation',{configurable:true,value:{canGoBack:true}});
  render(<BarraSuite />);
  expect(screen.getByRole('button',{name:'Atrás'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Adelante'})).toBeDisabled();
});

test('Navigation API refleja ambos booleanos y se actualiza', () => {
  const nav={canGoBack:true,canGoForward:false,
    addEventListener:jest.fn((_event:string,_callback:()=>void)=>{}),
    removeEventListener:jest.fn((_event:string,_callback:()=>void)=>{})};
  Object.defineProperty(globalThis,'navigation',{configurable:true,value:nav});
  const {unmount}=render(<BarraSuite />);
  expect(screen.getByRole('button',{name:'Atrás'})).toBeEnabled();
  expect(screen.getByRole('button',{name:'Adelante'})).toBeDisabled();
  const back=jest.spyOn(window.history,'back').mockImplementation(()=>{});
  fireEvent.click(screen.getByRole('button',{name:'Atrás'}));
  expect(back).toHaveBeenCalledTimes(1);
  nav.canGoBack=false;nav.canGoForward=true;
  act(()=>nav.addEventListener.mock.calls[0][1]());
  expect(screen.getByRole('button',{name:'Atrás'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Adelante'})).toBeEnabled();
  const forward=jest.spyOn(window.history,'forward').mockImplementation(()=>{});
  fireEvent.click(screen.getByRole('button',{name:'Adelante'}));
  expect(forward).toHaveBeenCalledTimes(1);
  unmount();
  expect(nav.removeEventListener).toHaveBeenCalledWith('currententrychange',nav.addEventListener.mock.calls[0][1]);
});
