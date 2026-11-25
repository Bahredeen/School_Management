import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import {
  getDefaultPermissionsForRole,
  isSupabaseConfigured,
  supabase,
  type AccountPermissions,
  type AssetCategory,
  type PropertyAsset,
  type StockMovement,
} from '../../lib/supabase';
import { translations, type Language } from '../../lib/i18n';
import type { PortalUser } from '../../App';

const fallbackAssets: PropertyAsset[] = [
  {
    id: '55555555-5555-5555-5555-555555555501',
    item_code: 'SA-AST-001',
    name: 'Student Dual Desks (Hardwood)',
    category: 'Furniture',
    item_type: 'fixed_asset',
    quantity: 320,
    min_stock_level: 20,
    unit_cost: 3800,
    location: 'Grades 1–12 Classrooms',
    condition: 'good',
    custodian: 'Bereket Yohannes',
  },
  {
    id: '55555555-5555-5555-5555-555555555502',
    item_code: 'SA-AST-002',
    name: 'Desktop Computers (Core i5)',
    category: 'IT & Electronics',
    item_type: 'fixed_asset',
    quantity: 42,
    min_stock_level: 5,
    unit_cost: 34000,
    location: 'ICT Lab 01',
    condition: 'good',
    custodian: 'Ekram Mohammad',
  },
  {
    id: '55555555-5555-5555-5555-555555555504',
    item_code: 'SA-STK-001',
    name: 'A4 Printing Paper (Reams)',
    category: 'Stationery & Consumables',
    item_type: 'consumable',
    quantity: 14,
    min_stock_level: 20,
    unit_cost: 650,
    location: 'Main Store Room',
    condition: 'good',
    custodian: 'Bereket Yohannes',
  },
  {
    id: '55555555-5555-5555-5555-555555555505',
    item_code: 'SA-STK-002',
    name: 'Whiteboard Markers (Boxes)',
    category: 'Stationery & Consumables',
    item_type: 'consumable',
    quantity: 8,
    min_stock_level: 15,
    unit_cost: 480,
    location: 'Staff Room Store',
    condition: 'good',
    custodian: 'Bereket Yohannes',
  },
];

const CATEGORIES: AssetCategory[] = [
  'Furniture',
  'IT & Electronics',
  'Lab Equipment',
  'Books & Library',
  'Stationery & Consumables',
  'Sports & Facilities',
];

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Boxes;
  accent: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${accent}`}>
          <Icon size={18} />
        </span>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function PropertyPortal({
  user,
  activeNavIndex,
  language,
  onNavigate,
}: {
  user: PortalUser;
  activeNavIndex: number;
  language: Language;
  onNavigate: (index: number) => void;
}) {
  const t = translations[language].dashboard;
  const isAm = language === 'am';

  const [permissions, setPermissions] = useState<AccountPermissions>(() =>
    getDefaultPermissionsForRole(user.id, user.role)
  );
  const [assets, setAssets] = useState<PropertyAsset[]>(fallbackAssets);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [toast, setToast] = useState('');

  // Filters
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Asset Add/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<PropertyAsset | null>(null);
  const [assetForm, setAssetForm] = useState({
    item_code: '',
    name: '',
    category: 'Furniture' as AssetCategory,
    item_type: 'fixed_asset' as PropertyAsset['item_type'],
    quantity: 1,
    min_stock_level: 5,
    unit_cost: 0,
    location: 'Main Store Room',
    condition: 'good' as PropertyAsset['condition'],
    custodian: user.name,
  });

  // Stock Movement Form
  const [movementForm, setMovementForm] = useState({
    asset_id: '',
    movement_type: 'stock_in' as StockMovement['movement_type'],
    quantity: 1,
    recipient_or_source: '',
    notes: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3400);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const loadPropertyData = async () => {
      const [permRes, assetsRes, movRes] = await Promise.all([
        supabase
          .from('account_permissions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('property_assets').select('*').order('item_code', { ascending: true }),
        supabase
          .from('stock_movements')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (permRes.data) setPermissions(permRes.data as AccountPermissions);
      if (assetsRes.data && assetsRes.data.length > 0) {
        const loaded = assetsRes.data as PropertyAsset[];
        setAssets(loaded);
        setMovementForm((prev) => ({ ...prev, asset_id: loaded[0].id }));
      }
      if (movRes.data) setMovements(movRes.data as StockMovement[]);
    };

    loadPropertyData();
  }, [user.id]);

  const canCreateEdit =
    permissions.property_access === 'create_edit' ||
    permissions.property_access === 'full_crud';
  const canDelete = permissions.property_access === 'full_crud';

  const fixedAssets = useMemo(
    () => assets.filter((a) => a.item_type === 'fixed_asset'),
    [assets]
  );

  const consumables = useMemo(
    () => assets.filter((a) => a.item_type === 'consumable'),
    [assets]
  );

  const lowStockItems = useMemo(
    () => assets.filter((a) => a.quantity <= a.min_stock_level),
    [assets]
  );

  const totalInventoryValuation = useMemo(
    () =>
      assets.reduce(
        (acc, item) => acc + Number(item.quantity || 0) * Number(item.unit_cost || 0),
        0
      ),
    [assets]
  );

  const filteredFixedAssets = useMemo(() => {
    return fixedAssets.filter((a) => {
      const matchesQ =
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.item_code.toLowerCase().includes(query.toLowerCase()) ||
        (a.location || '').toLowerCase().includes(query.toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || a.category === categoryFilter;
      return matchesQ && matchesCat;
    });
  }, [fixedAssets, query, categoryFilter]);

  const filteredConsumables = useMemo(() => {
    return consumables.filter((a) => {
      const matchesQ =
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.item_code.toLowerCase().includes(query.toLowerCase());
      return matchesQ;
    });
  }, [consumables, query]);

  // === ASSET CRUD ===
  const openAddModal = (defaultType: PropertyAsset['item_type']) => {
    if (!canCreateEdit) return;
    setEditingAsset(null);
    const prefix = defaultType === 'fixed_asset' ? 'SA-AST' : 'SA-STK';
    const nextNum = String(assets.length + 1).padStart(3, '0');
    setAssetForm({
      item_code: `${prefix}-${nextNum}`,
      name: '',
      category:
        defaultType === 'fixed_asset' ? 'Furniture' : 'Stationery & Consumables',
      item_type: defaultType,
      quantity: 1,
      min_stock_level: 5,
      unit_cost: 0,
      location: 'Main Store Room',
      condition: 'good',
      custodian: user.name,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: PropertyAsset) => {
    if (!canCreateEdit) return;
    setEditingAsset(item);
    setAssetForm({
      item_code: item.item_code,
      name: item.name,
      category: item.category,
      item_type: item.item_type,
      quantity: item.quantity,
      min_stock_level: item.min_stock_level,
      unit_cost: Number(item.unit_cost) || 0,
      location: item.location || '',
      condition: item.condition,
      custodian: item.custodian || '',
    });
    setModalOpen(true);
  };

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.name.trim() || !assetForm.item_code.trim()) return;

    if (editingAsset) {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('property_assets')
          .update({ ...assetForm, updated_at: new Date().toISOString() })
          .eq('id', editingAsset.id)
          .select()
          .single();
        if (error) {
          showToast(error.message);
          return;
        }
        if (data) {
          setAssets((prev) =>
            prev.map((a) => (a.id === editingAsset.id ? (data as PropertyAsset) : a))
          );
        }
      } else {
        setAssets((prev) =>
          prev.map((a) => (a.id === editingAsset.id ? { ...a, ...assetForm } : a))
        );
      }
      showToast(isAm ? 'የንብረት መረጃ ተዘምኗል።' : 'Inventory item updated.');
    } else {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('property_assets')
          .insert([assetForm])
          .select()
          .single();
        if (error) {
          showToast(error.message);
          return;
        }
        if (data) {
          setAssets((prev) => [...prev, data as PropertyAsset]);
        }
      } else {
        setAssets((prev) => [
          ...prev,
          { id: `local-ast-${Date.now()}`, ...assetForm },
        ]);
      }
      showToast(isAm ? 'አዲስ ንብረት / እቃ ተመዝግቧል።' : 'New item added to inventory.');
    }
    setModalOpen(false);
  };

  const handleDeleteAsset = async (id: string) => {
    if (!canDelete) return;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('property_assets').delete().eq('id', id);
    }
    setAssets((prev) => prev.filter((a) => a.id !== id));
    showToast(isAm ? 'ንብረቱ ከመዝገብ ተሰርዟል።' : 'Item deleted from inventory.');
  };

  // === RECORD STOCK MOVEMENT (IN / ISSUE / RETURN / WRITE-OFF) ===
  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateEdit || !movementForm.asset_id || movementForm.quantity <= 0) return;

    const target = assets.find((a) => a.id === movementForm.asset_id);
    if (!target) return;

    const isAddition =
      movementForm.movement_type === 'stock_in' ||
      movementForm.movement_type === 'returned';

    if (!isAddition && target.quantity < movementForm.quantity) {
      showToast(
        isAm
          ? `በመጋዘን ያለው ብዛት (${target.quantity}) ከሚወጣው ያንሳል።`
          : `Insufficient stock: only ${target.quantity} available.`
      );
      return;
    }

    const nextQuantity = isAddition
      ? target.quantity + Number(movementForm.quantity)
      : target.quantity - Number(movementForm.quantity);

    const payload = {
      asset_id: movementForm.asset_id,
      movement_type: movementForm.movement_type,
      quantity: Number(movementForm.quantity),
      recipient_or_source: movementForm.recipient_or_source.trim(),
      notes: movementForm.notes.trim() || null,
      recorded_by: user.id,
    };

    if (isSupabaseConfigured && supabase) {
      const { data: movData, error: movErr } = await supabase
        .from('stock_movements')
        .insert([payload])
        .select()
        .single();

      if (movErr) {
        showToast(movErr.message);
        return;
      }

      await supabase
        .from('property_assets')
        .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
        .eq('id', target.id);

      if (movData) {
        setMovements((prev) => [movData as StockMovement, ...prev]);
      }
    } else {
      setMovements((prev) => [
        {
          id: `mov-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...payload,
        },
        ...prev,
      ]);
    }

    setAssets((prev) =>
      prev.map((a) => (a.id === target.id ? { ...a, quantity: nextQuantity } : a))
    );
    setMovementForm((prev) => ({
      ...prev,
      quantity: 1,
      recipient_or_source: '',
      notes: '',
    }));
    showToast(
      isAm
        ? 'የስቶክ እንቅስቃሴ ተመዝግቦ ብዛቱ ተዘምኗል።'
        : 'Stock movement recorded and balance updated.'
    );
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#073c2f] px-4 py-3 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 size={16} className="text-[#e4b65e]" />
          <span>{toast}</span>
        </div>
      )}

      {/* TAB 0: PROPERTY & INVENTORY OVERVIEW */}
      {activeNavIndex === 0 && (
        <>
          <div className="welcome-row">
            <div>
              <p className="eyebrow">
                {isAm ? 'የንብረት እና ስቶክ አስተዳደር' : 'Property & Inventory Management'}
              </p>
              <h1>
                {t.goodMorning}, {user.name.split(' ')[0]}.
              </h1>
              <p className="subtle">
                {isAm
                  ? 'የሰላም አካዳሚ ቋሚ ንብረቶችን፣ አላቂ እቃዎችን እና የመጋዘን እንቅስቃሴዎችን ይቆጣጠሩ።'
                  : 'Track fixed school assets, consumable supplies, and department stock issues.'}
              </p>
            </div>
            {canCreateEdit && (
              <button
                className="primary-button"
                onClick={() => openAddModal('fixed_asset')}
              >
                <Plus size={16} /> {isAm ? 'አዲስ ንብረት መዝግብ' : 'Register Asset / Stock'}
              </button>
            )}
          </div>

          <div className="stat-grid">
            <StatCard
              label={isAm ? 'ቋሚ ንብረቶች' : 'Fixed Assets'}
              value={String(fixedAssets.length)}
              detail={
                isAm
                  ? `${fixedAssets.reduce((s, a) => s + a.quantity, 0)} ጠቅላላ እቃዎች`
                  : `${fixedAssets.reduce((s, a) => s + a.quantity, 0)} total units`
              }
              icon={Boxes}
              accent="green"
            />
            <StatCard
              label={isAm ? 'ጠቅላላ የንብረት ግምት (ETB)' : 'Total Inventory Value'}
              value={`${totalInventoryValuation.toLocaleString()} ETB`}
              detail={isAm ? 'ቋሚ እና አላቂ እቃዎች' : 'Assets & consumables valuation'}
              icon={CircleDollarSign}
              accent="gold"
            />
            <StatCard
              label={isAm ? 'አላቂ እቃዎች (Consumables)' : 'Consumable Stock Items'}
              value={String(consumables.length)}
              detail={isAm ? 'ወረቀት፣ ማርከር እና ሌሎች' : 'Stationery & lab supplies'}
              icon={Package}
              accent="blue"
            />
            <StatCard
              label={isAm ? 'ያለቁ / አነስተኛ እቃዎች' : 'Low Stock Alerts'}
              value={String(lowStockItems.length)}
              detail={isAm ? 'እንደገና መገዛት ያለባቸው' : 'Below minimum reorder level'}
              icon={AlertTriangle}
              accent="rose"
            />
          </div>

          {lowStockItems.length > 0 && (
            <section className="panel border border-[#f0c7bf] bg-[#fffaf9]">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow text-[#b34a3c]">
                    {isAm ? 'አስቸኳይ ማሳሰቢያ' : 'Reorder Alert'}
                  </p>
                  <h2>
                    {isAm
                      ? 'በመጋዘን ውስጥ ያነሱ እቃዎች'
                      : 'Items Below Minimum Stock Threshold'}
                  </h2>
                </div>
                <button className="text-button" onClick={() => onNavigate(3)}>
                  {isAm ? 'አዲስ ግዢ መዝግብ →' : 'Restock now →'}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#f2d6d0] bg-white p-3.5 text-xs flex items-center justify-between"
                  >
                    <div>
                      <b className="text-[#19362b]">{item.name}</b>
                      <p className="text-[#82928a]">
                        {item.item_code} · {item.location}
                      </p>
                    </div>
                    <span className="rounded bg-[#fae9e5] px-2.5 py-1 font-bold text-[#b34a3c]">
                      {item.quantity} / {item.min_stock_level}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* TAB 1: FIXED ASSETS & EQUIPMENT */}
      {activeNavIndex === 1 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isAm ? 'የትምህርት ቤት ቋሚ ንብረቶች' : 'Asset Registry'}</p>
              <h2>{isAm ? 'ቋሚ ንብረቶች እና መሳሪያዎች' : 'Fixed Assets & Classroom Equipment'}</h2>
            </div>
            {canCreateEdit && (
              <button
                className="primary-button"
                onClick={() => openAddModal('fixed_asset')}
              >
                <Plus size={16} /> {isAm ? 'ቋሚ ንብረት ጨምር' : 'Add Fixed Asset'}
              </button>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-[#d9e2dd] bg-[#fbfcfb] px-3 py-2 text-xs flex-1 min-w-[200px]">
              <Search size={15} className="text-[#749084]" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder={
                  isAm ? 'በንብረት ስም፣ ኮድ ወይም ክፍል ይፈልጉ...' : 'Search by name, code, or room...'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-[#d9e2dd] bg-white px-3 py-2 text-xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">{isAm ? 'ሁሉም ምድቦች' : 'All Categories'}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{isAm ? 'ኮድ' : 'Code'}</th>
                  <th>{isAm ? 'የንብረት ስም' : 'Asset Name'}</th>
                  <th>{isAm ? 'ምድብ' : 'Category'}</th>
                  <th>{isAm ? 'ብዛት' : 'Qty'}</th>
                  <th>{isAm ? 'የአንዱ ዋጋ' : 'Unit Cost'}</th>
                  <th>{isAm ? 'ቦታ / ክፍል' : 'Location'}</th>
                  <th>{isAm ? 'ሁኔታ' : 'Condition'}</th>
                  <th>{isAm ? 'ድርጊት' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFixedAssets.map((item) => (
                  <tr key={item.id}>
                    <td className="muted-cell font-mono">{item.item_code}</td>
                    <td>
                      <div className="font-semibold text-[#19362b]">{item.name}</div>
                      <small className="text-[#8a9992]">{item.custodian}</small>
                    </td>
                    <td>{item.category}</td>
                    <td className="font-bold text-[#073c2f]">{item.quantity}</td>
                    <td>{Number(item.unit_cost).toLocaleString()} ETB</td>
                    <td>{item.location || '—'}</td>
                    <td>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.condition === 'good'
                            ? 'bg-[#e9f5ed] text-[#3b805d]'
                            : 'bg-[#faead0] text-[#a9691f]'
                        }`}
                      >
                        {item.condition.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {canCreateEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="rounded p-1.5 text-[#23624d] hover:bg-[#e9f5ed]"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(item.id)}
                            className="rounded p-1.5 text-[#b34a3c] hover:bg-[#fae9e5]"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: CONSUMABLE STOCK & SUPPLIES */}
      {activeNavIndex === 2 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isAm ? 'አላቂ የመጋዘን እቃዎች' : 'Store Supplies'}</p>
              <h2>{isAm ? 'አላቂ እቃዎች (Consumable Stock)' : 'Consumable Stock & Supplies'}</h2>
            </div>
            {canCreateEdit && (
              <button
                className="primary-button"
                onClick={() => openAddModal('consumable')}
              >
                <Plus size={16} /> {isAm ? 'አላቂ እቃ ጨምር' : 'Add Consumable Item'}
              </button>
            )}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{isAm ? 'ኮድ' : 'Code'}</th>
                  <th>{isAm ? 'የእቃው ስም' : 'Supply Name'}</th>
                  <th>{isAm ? 'ያለው ብዛት' : 'In Stock'}</th>
                  <th>{isAm ? 'ዝቅተኛ ገደብ' : 'Min Threshold'}</th>
                  <th>{isAm ? 'ቦታ' : 'Store Location'}</th>
                  <th>{isAm ? 'ሁኔታ' : 'Stock Status'}</th>
                  <th>{isAm ? 'ድርጊት' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsumables.map((item) => {
                  const isLow = item.quantity <= item.min_stock_level;
                  return (
                    <tr key={item.id}>
                      <td className="muted-cell font-mono">{item.item_code}</td>
                      <td className="font-semibold text-[#19362b]">{item.name}</td>
                      <td className="font-bold text-sm text-[#073c2f]">{item.quantity}</td>
                      <td>{item.min_stock_level}</td>
                      <td>{item.location || 'Main Store'}</td>
                      <td>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            isLow
                              ? 'bg-[#fae9e5] text-[#b34a3c]'
                              : 'bg-[#e9f5ed] text-[#3b805d]'
                          }`}
                        >
                          {isLow
                            ? isAm
                              ? 'አነስተኛ (Low Stock)'
                              : 'Low Stock'
                            : isAm
                            ? 'በቂ (Healthy)'
                            : 'In Stock'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {canCreateEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="rounded p-1.5 text-[#23624d] hover:bg-[#e9f5ed]"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAsset(item.id)}
                              className="rounded p-1.5 text-[#b34a3c] hover:bg-[#fae9e5]"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: STOCK IN / ISSUE / RETURN LOG */}
      {activeNavIndex === 3 && (
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          {canCreateEdit && (
            <section className="panel h-fit">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{isAm ? 'የመጋዘን እንቅስቃሴ' : 'Inventory Transaction'}</p>
                  <h2>{isAm ? 'እቃ ገቢ / ወጪ መዝግብ' : 'Record Stock Movement'}</h2>
                </div>
              </div>
              <form onSubmit={handleRecordMovement} className="space-y-3 text-xs">
                <label className="block font-semibold text-[#3c5149]">
                  {isAm ? 'ንብረት / እቃ ይምረጡ' : 'Select Item'}
                  <select
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2.5"
                    value={movementForm.asset_id}
                    onChange={(e) =>
                      setMovementForm({ ...movementForm, asset_id: e.target.value })
                    }
                    required
                  >
                    <option value="">{isAm ? '-- እቃ ይምረጡ --' : '-- Choose Item --'}</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.item_code} — {a.name} (Qty: {a.quantity})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block font-semibold text-[#3c5149]">
                    {isAm ? 'የእንቅስቃሴ ዓይነት' : 'Movement Type'}
                    <select
                      className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                      value={movementForm.movement_type}
                      onChange={(e) =>
                        setMovementForm({
                          ...movementForm,
                          movement_type: e.target.value as StockMovement['movement_type'],
                        })
                      }
                    >
                      <option value="stock_in">{isAm ? 'ገቢ (Stock In)' : 'Stock In (+)'}</option>
                      <option value="issued">{isAm ? 'ወጪ (Issued)' : 'Issue to Dept (-)'}</option>
                      <option value="returned">{isAm ? 'ተመላሽ (Returned)' : 'Returned (+)'}</option>
                      <option value="damaged_writeoff">
                        {isAm ? 'የተበላሸ (Damaged)' : 'Damaged Write-Off (-)'}
                      </option>
                    </select>
                  </label>
                  <label className="block font-semibold text-[#3c5149]">
                    {isAm ? 'ብዛት' : 'Quantity'}
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                      value={movementForm.quantity}
                      onChange={(e) =>
                        setMovementForm({
                          ...movementForm,
                          quantity: Number(e.target.value),
                        })
                      }
                      required
                    />
                  </label>
                </div>

                <label className="block font-semibold text-[#3c5149]">
                  {isAm ? 'ተቀባይ ክፍል / አቅራቢ' : 'Recipient Department / Supplier'}
                  <input
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5"
                    placeholder="e.g. Grade 9 Teachers / Hawassa Stationery"
                    value={movementForm.recipient_or_source}
                    onChange={(e) =>
                      setMovementForm({
                        ...movementForm,
                        recipient_or_source: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label className="block font-semibold text-[#3c5149]">
                  {isAm ? 'ማስታወሻ' : 'Notes'}
                  <input
                    className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2.5"
                    placeholder="Optional voucher or note..."
                    value={movementForm.notes}
                    onChange={(e) =>
                      setMovementForm({ ...movementForm, notes: e.target.value })
                    }
                  />
                </label>

                <button type="submit" className="primary-button w-full">
                  <Wrench size={15} /> {isAm ? 'መዝግብ እና አዘምን' : 'Record Stock Movement'}
                </button>
              </form>
            </section>
          )}

          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{isAm ? 'የእቃ ዝውውር ታሪክ' : 'Audit Trail'}</p>
                <h2>{isAm ? 'የመጋዘን ገቢ እና ወጪ መዝገብ' : 'Recent Stock Movements'}</h2>
              </div>
            </div>

            {movements.length === 0 ? (
              <div className="empty-content">
                <p>
                  {isAm
                    ? 'እስካሁን የተመዘገበ የእቃ ገቢ/ወጪ የለም።'
                    : 'No stock movements recorded yet. Use the form on the left to log purchases or issues.'}
                </p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{isAm ? 'እቃ' : 'Item'}</th>
                      <th>{isAm ? 'ዓይነት' : 'Type'}</th>
                      <th>{isAm ? 'ብዛት' : 'Qty'}</th>
                      <th>{isAm ? 'ተቀባይ / አቅራቢ' : 'Recipient / Source'}</th>
                      <th>{isAm ? 'ቀን' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((mov) => {
                      const item = assets.find((a) => a.id === mov.asset_id);
                      const isIn =
                        mov.movement_type === 'stock_in' ||
                        mov.movement_type === 'returned';
                      return (
                        <tr key={mov.id}>
                          <td className="font-semibold text-[#19362b]">
                            {item?.name || 'Item'}
                          </td>
                          <td>
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                isIn
                                  ? 'bg-[#e9f5ed] text-[#3b805d]'
                                  : 'bg-[#faead0] text-[#a9691f]'
                              }`}
                            >
                              {isIn ? (
                                <ArrowDownLeft size={11} />
                              ) : (
                                <ArrowUpRight size={11} />
                              )}
                              {mov.movement_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="font-bold">
                            {isIn ? `+${mov.quantity}` : `-${mov.quantity}`}
                          </td>
                          <td>{mov.recipient_or_source}</td>
                          <td className="muted-cell">
                            {new Date(mov.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ADD / EDIT ASSET MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#19362b]">
                {editingAsset
                  ? isAm
                    ? 'የንብረት መረጃ አስተካክል'
                    : 'Edit Inventory Item'
                  : isAm
                  ? 'አዲስ ንብረት / እቃ መዝግብ'
                  : 'Add Inventory Item'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#749084]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="grid grid-cols-2 gap-3 text-xs">
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'መለያ ኮድ' : 'Item Code'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={assetForm.item_code}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, item_code: e.target.value })
                  }
                  required
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ዓይነት' : 'Inventory Type'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={assetForm.item_type}
                  onChange={(e) =>
                    setAssetForm({
                      ...assetForm,
                      item_type: e.target.value as PropertyAsset['item_type'],
                    })
                  }
                >
                  <option value="fixed_asset">Fixed Asset</option>
                  <option value="consumable">Consumable Stock</option>
                </select>
              </label>
              <label className="col-span-2 font-semibold text-[#3c5149]">
                {isAm ? 'የእቃው ስም' : 'Item Name'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  required
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ምድብ' : 'Category'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={assetForm.category}
                  onChange={(e) =>
                    setAssetForm({
                      ...assetForm,
                      category: e.target.value as AssetCategory,
                    })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ሁኔታ' : 'Condition'}
                <select
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] bg-white px-3 py-2"
                  value={assetForm.condition}
                  onChange={(e) =>
                    setAssetForm({
                      ...assetForm,
                      condition: e.target.value as PropertyAsset['condition'],
                    })
                  }
                >
                  <option value="good">Good</option>
                  <option value="needs_repair">Needs Repair</option>
                  <option value="damaged">Damaged</option>
                  <option value="disposed">Disposed</option>
                </select>
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ብዛት' : 'Quantity'}
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={assetForm.quantity}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, quantity: Number(e.target.value) })
                  }
                  required
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ዝቅተኛ ማንቂያ ገደብ' : 'Min Reorder Level'}
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={assetForm.min_stock_level}
                  onChange={(e) =>
                    setAssetForm({
                      ...assetForm,
                      min_stock_level: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'የአንዱ ዋጋ (ETB)' : 'Unit Cost (ETB)'}
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={assetForm.unit_cost}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, unit_cost: Number(e.target.value) })
                  }
                />
              </label>
              <label className="font-semibold text-[#3c5149]">
                {isAm ? 'ቦታ / መጋዘን' : 'Location / Room'}
                <input
                  className="mt-1 w-full rounded-lg border border-[#d9e2dd] px-3 py-2"
                  value={assetForm.location}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, location: e.target.value })
                  }
                />
              </label>
              <div className="col-span-2 mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalOpen(false)}
                >
                  {isAm ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button type="submit" className="primary-button">
                  {isAm ? 'መረጃውን አስቀምጥ' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}