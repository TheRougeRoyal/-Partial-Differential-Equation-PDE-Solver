import { useState, useEffect } from 'react';
import { FileText, Plus, X, Download } from 'lucide-react';
import { generateOrders, generateCurrentPrice } from '../../utils/mockData';
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters';
import { exportToCSV, exportToJSON } from '../../utils/exportData';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import './OrdersPage.css';

const ASSETS = ['BTC-USD', 'ETH-USD', 'SOL-USD'];
const ORDER_TYPES = ['market', 'limit', 'stop'];

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    asset: 'BTC-USD',
    side: 'buy',
    type: 'limit',
    qty: '',
    price: '',
  });
  const { toggleTheme } = useTheme();

  useEffect(() => {
    setOrders(generateOrders());
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newOrder = {
      id: `ord-${Date.now()}`,
      asset: formData.asset,
      side: formData.side,
      type: formData.type,
      qty: parseFloat(formData.qty),
      price: formData.type === 'market' ? generateCurrentPrice(formData.asset) : parseFloat(formData.price),
      status: 'pending',
      timestamp: new Date(),
    };

    setOrders(prev => [newOrder, ...prev]);
    setShowModal(false);
    setFormData({ asset: 'BTC-USD', side: 'buy', type: 'limit', qty: '', price: '' });
    toast.success('Order routed successfully');
  };

  const handleCancel = (orderId) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: 'cancelled' } : order
    ));
    toast.success('Order cancelled');
  };

  const handleExportCSV = () => {
    const exportData = orders.map(o => ({
      timestamp: o.timestamp.toISOString(),
      asset: o.asset,
      side: o.side,
      type: o.type,
      quantity: o.qty,
      price: o.price,
      status: o.status,
    }));
    exportToCSV(exportData, 'orders');
    toast.success('Exported orders to CSV');
  };

  const handleExportJSON = () => {
    exportToJSON(orders, 'orders');
    toast.success('Exported orders to JSON');
  };

  useKeyboardShortcuts({
    toggleTheme,
    newOrder: () => setShowModal(true),
    closeModal: () => setShowModal(false),
    exportCSV: handleExportCSV,
    exportJSON: handleExportJSON,
  });

  return (
    <div className="orders-page" data-testid="orders-page">
      {/* ── Header ── */}
      <div className="orders-page-header">
        <div className="orders-title-group">
          <div className="orders-icon-wrap">
            <FileText size={18} className="orders-book-icon" />
          </div>
          <div>
          <h1 className="orders-page-title">Execution Blotter</h1>
            <p className="orders-page-subtitle">Broker-routed orders, fills, cancels, and execution history</p>
          </div>
        </div>
        <div className="orders-header-actions">
          <button className="orders-export-btn" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download size={13} />
            <span>CSV</span>
          </button>
          <button
            className="orders-new-btn"
            onClick={() => setShowModal(true)}
            data-testid="new-order-btn"
          >
            <Plus size={15} />
            <span>Route Order</span>
          </button>
        </div>
      </div>

      {/* ── Orders Table ── */}
      <div className="orders-table-wrap" data-testid="orders-table">
        {orders.length > 0 ? (
          <div className="orders-tbl">
            <div className="orders-tbl-head">
              <div className="orders-th">Time</div>
              <div className="orders-th">Asset</div>
              <div className="orders-th th-center">Side</div>
              <div className="orders-th">Type</div>
              <div className="orders-th th-right">Qty</div>
              <div className="orders-th th-right">Price</div>
              <div className="orders-th th-center">Status</div>
              <div className="orders-th th-center">Action</div>
            </div>
            {orders.map((order, index) => (
              <div
                className={`orders-tbl-row`}
                key={order.id}
                data-testid={`order-row-${index}`}
                style={{ animationDelay: `${Math.min(index * 0.03, 0.6)}s` }}
              >
                <div className={`orders-row-indicator indicator-${order.side}`} />
                <div className="orders-td td-dim">{formatDateTime(order.timestamp)}</div>
                <div className="orders-td td-asset">{order.asset}</div>
                <div className="orders-td td-center">
                  <span className={`orders-side-badge side-${order.side}`}>{order.side}</span>
                </div>
                <div className="orders-td td-dim td-type">{order.type}</div>
                <div className="orders-td td-right">{formatNumber(order.qty, 4)}</div>
                <div className="orders-td td-right">
                  {order.price ? formatCurrency(order.price) : 'Market'}
                </div>
                <div className="orders-td td-center">
                  <span className={`orders-status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </div>
                <div className="orders-td td-center">
                  <button
                    className="orders-cancel-btn"
                    onClick={() => handleCancel(order.id)}
                    disabled={order.status !== 'pending'}
                    data-testid={`cancel-btn-${index}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="orders-empty">
            <FileText className="orders-empty-icon" size={48} />
            <p className="orders-empty-text">No routed orders yet. Use Route Order to create one.</p>
          </div>
        )}
      </div>

      {/* ── New Order Modal ── */}
      {showModal && (
        <div className="orders-modal-overlay" onClick={() => setShowModal(false)} data-testid="order-modal">
          <div className="orders-modal-glass" onClick={(e) => e.stopPropagation()}>
            <div className="orders-modal-head">
              <h3 className="orders-modal-title">ROUTE ORDER</h3>
              <button className="orders-modal-close" onClick={() => setShowModal(false)} data-testid="close-modal-btn">
                <X size={16} />
              </button>
            </div>
            <form className="orders-form" onSubmit={handleSubmit}>
              <div className="orders-form-group">
                <label className="orders-form-label">Asset</label>
                <select
                  className="orders-form-select"
                  value={formData.asset}
                  onChange={(e) => handleInputChange('asset', e.target.value)}
                  data-testid="form-asset"
                >
                  {ASSETS.map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>

              <div className="orders-form-group">
                <label className="orders-form-label">Side</label>
                <div className="orders-side-btns">
                  <button
                    type="button"
                    className={`orders-side-btn side-buy-btn ${formData.side === 'buy' ? 'active' : ''}`}
                    onClick={() => handleInputChange('side', 'buy')}
                    data-testid="form-side-buy"
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    className={`orders-side-btn side-sell-btn ${formData.side === 'sell' ? 'active' : ''}`}
                    onClick={() => handleInputChange('side', 'sell')}
                    data-testid="form-side-sell"
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="orders-form-row">
                <div className="orders-form-group">
                  <label className="orders-form-label">Order Type</label>
                  <select
                    className="orders-form-select"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    data-testid="form-type"
                  >
                    {ORDER_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="orders-form-group">
                  <label className="orders-form-label">Quantity</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="orders-form-input"
                    value={formData.qty}
                    onChange={(e) => handleInputChange('qty', e.target.value)}
                    placeholder="0.0000"
                    required
                    data-testid="form-qty"
                  />
                </div>
              </div>

              {formData.type !== 'market' && (
                <div className="orders-form-group">
                  <label className="orders-form-label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="orders-form-input"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    required
                    data-testid="form-price"
                  />
                </div>
              )}

              <button type="submit" className="orders-submit-btn" data-testid="submit-order-btn">
                Route Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
