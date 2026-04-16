/**
 * PurchaseManager.js
 * 캐릭터 DLC 구매 관리 — RevenueCat + 로컬 폴백
 *
 * 환경별 동작:
 *   Android/iOS (Capacitor) → RevenueCat 실제 결제
 *   Electron / 브라우저 개발 → localStorage 목 결제 (개발용)
 *
 * 상품 ID (Google Play Console에서 동일하게 등록 필요):
 *   char_doctor       — 의사 이지수 ₩2,900
 *   char_soldier      — 군인 강민준 ₩2,900
 *   char_homeless     — 노숙인 최형식 ₩2,900
 *   char_chef          — 셰프 윤재혁 ₩2,900
 *   char_engineer     — 엔지니어 정대한 ₩2,900
 *   char_all_pack     — 전체 팩 ₩9,900
 */

import { isNative } from './MobileAdapter.js';

// ── 상품 정의 ─────────────────────────────────────────────────
export const PRODUCTS = {
  char_doctor:      { id: 'char_doctor',     charId: 'doctor',     name: '의사 이지수',    price: '₩2,900' },
  char_soldier:     { id: 'char_soldier',    charId: 'soldier',    name: '군인 강민준',    price: '₩2,900' },
  char_homeless:    { id: 'char_homeless',   charId: 'homeless',   name: '노숙인 최형식',  price: '₩2,900' },
  char_chef:        { id: 'char_chef',       charId: 'chef',       name: '셰프 윤재혁',    price: '₩2,900' },
  char_engineer:    { id: 'char_engineer',   charId: 'engineer',   name: '엔지니어 정대한', price: '₩2,900' },
  char_all_pack:    { id: 'char_all_pack',   charId: null,         name: '전체 캐릭터 팩', price: '₩9,900' },
};

/** 소방관은 항상 무료 (기본 캐릭터) */
export const FREE_CHARACTER_ID = 'firefighter';

// ── RevenueCat 공개 API 키 (Google Play용) ───────────────────
// 실제 키는 RevenueCat 대시보드에서 발급받아 아래에 입력
const REVENUECAT_API_KEY_ANDROID = 'goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const REVENUECAT_API_KEY_IOS     = 'appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

// ── localStorage 키 ───────────────────────────────────────────
const STORAGE_KEY = 'CARD_SURVIVAL_UNLOCKED_CHARS_v1';

// ── 내부 상태 ────────────────────────────────────────────────
let _initialized = false;
let _Purchases = null; // RevenueCat 인스턴스 (네이티브 전용)

// ── 초기화 ───────────────────────────────────────────────────

/**
 * 앱 시작 시 1회 호출
 * MobileAdapter.initMobileAdapter() 이후에 호출되어야 함
 */
export async function initPurchaseManager() {
  if (_initialized) return;
  _initialized = true;

  if (!isNative()) {
    console.log('[PurchaseManager] 개발 환경 — 목 구매 모드');
    return;
  }

  try {
    const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
    _Purchases = Purchases;

    const apiKey = _isAndroid()
      ? REVENUECAT_API_KEY_ANDROID
      : REVENUECAT_API_KEY_IOS;

    await Purchases.configure({ apiKey });
    console.log('[PurchaseManager] RevenueCat 초기화 완료');

    // 서버에서 최신 구매 이력 동기화
    await _syncServerPurchases();
  } catch (err) {
    console.warn('[PurchaseManager] RevenueCat 초기화 실패:', err);
  }
}

// ── 공개 API ────────────────────────────────────────────────

/**
 * 캐릭터 해금 여부 확인
 * @param {string} charId — characters.js의 id 값
 * @returns {boolean}
 */
export function isCharacterUnlocked(charId) {
  if (charId === FREE_CHARACTER_ID) return true; // 소방관 항상 무료

  const unlocked = _loadUnlocked();
  return unlocked.includes(charId);
}

/**
 * 캐릭터 DLC 구매 시도
 * @param {string} productId — PRODUCTS 객체의 키
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function purchaseCharacter(productId) {
  const product = PRODUCTS[productId];
  if (!product) return { success: false, error: '알 수 없는 상품 ID' };

  if (!isNative()) {
    // 개발 환경: 즉시 언락 (목)
    return _devPurchase(productId);
  }

  try {
    const result = await _Purchases.purchaseStoreProduct({
      product: { productIdentifier: productId },
    });

    if (result?.customerInfo?.entitlements?.active?.[productId]) {
      _applyPurchase(productId);
      return { success: true };
    }
    return { success: false, error: '결제가 확인되지 않았습니다.' };
  } catch (err) {
    if (err?.code === 'PURCHASE_CANCELLED') {
      return { success: false, error: '결제가 취소되었습니다.' };
    }
    console.error('[PurchaseManager] 결제 오류:', err);
    return { success: false, error: '결제 중 오류가 발생했습니다.' };
  }
}

/**
 * 이전 구매 복원 (앱 재설치 시 사용)
 * @returns {Promise<{ success: boolean, restoredCount: number }>}
 */
export async function restorePurchases() {
  if (!isNative()) {
    return { success: true, restoredCount: 0 };
  }

  try {
    const customerInfo = await _Purchases.restorePurchases();
    const count = _applyCustomerInfo(customerInfo);
    return { success: true, restoredCount: count };
  } catch (err) {
    console.error('[PurchaseManager] 복원 실패:', err);
    return { success: false, restoredCount: 0 };
  }
}

/**
 * 현재 해금된 캐릭터 ID 목록
 * @returns {string[]}
 */
export function getUnlockedCharacters() {
  return [FREE_CHARACTER_ID, ..._loadUnlocked()];
}

// ── 내부 헬퍼 ───────────────────────────────────────────────

function _isAndroid() {
  return typeof window !== 'undefined' &&
    window.Capacitor?.getPlatform() === 'android';
}

function _loadUnlocked() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function _saveUnlocked(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(list)]));
}

function _applyPurchase(productId) {
  const product = PRODUCTS[productId];
  const current = _loadUnlocked();

  if (productId === 'char_all_pack') {
    // 전체 팩: 모든 캐릭터 언락
    const all = Object.values(PRODUCTS)
      .filter(p => p.charId)
      .map(p => p.charId);
    _saveUnlocked([...current, ...all]);
  } else if (product?.charId) {
    _saveUnlocked([...current, product.charId]);
  }
}

function _applyCustomerInfo(customerInfo) {
  const active = customerInfo?.customerInfo?.entitlements?.active ?? {};
  let count = 0;
  Object.keys(active).forEach(productId => {
    if (PRODUCTS[productId]) {
      _applyPurchase(productId);
      count++;
    }
  });
  return count;
}

async function _syncServerPurchases() {
  if (!_Purchases) return;
  try {
    const customerInfo = await _Purchases.getCustomerInfo();
    _applyCustomerInfo(customerInfo);
  } catch (_) {}
}

/** 개발 환경 목 구매 */
function _devPurchase(productId) {
  _applyPurchase(productId);
  console.log(`[PurchaseManager DEV] 구매 완료: ${productId}`);
  return { success: true };
}
