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
    toast.success('Order submitted successfully');
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Order management and history</p>
        </div>
        <div className="page-actions">
          <button className="asset-btn" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download size={14} /> CSV
          </button>
          <button
            className="new-order-btn"
            onClick={() => setShowModal(true)}
            data-testid="new-order-btn"
          >
            <Plus size={16} />
            New Order
          </button>
        </div>
      </div>

      <div className="orders-table-container" data-testid="orders-table">
        {orders.length > 0 ? (
          <div className="orders-table">
            <div className="orders-header">
              <div className="orders-header-cell">Time</div>
              <div className="orders-header-cell">Asset</div>
              <div className="orders-header-cell center">Side</div>
              <div className="orders-header-cell">Type</div>
              <div className="orders-header-cell right">Qty</div>
              <div className="orders-header-cell right">Price</div>
              <div className="orders-header-cell center">Status</div>
              <div className="orders-header-cell center">Action</div>
            </div>
            {orders.map((order, index) => (
              <div className="orders-row" key={order.id} data-testid={`order-row-${index}`}>
                <div className="orders-cell secondary">{formatDateTime(order.timestamp)}</div>
                <div className="orders-cell">{order.asset}</div>
                <div className="orders-cell center">
                  <span className={`side-badge ${order.side}`}>{order.side}</span>
                </div>
                <div className="orders-cell secondary">{order.type}</div>
                <div className="orders-cell right">{formatNumber(order.qty, 4)}</div>
                <div className="orders-cell right">
                  {order.price ? formatCurrency(order.price) : 'Market'}
                </div>
                <div className="orders-cell center">
                  <span className={`status-badge ${order.status}`}>{order.status}</span>
                </div>
                <div className="orders-cell center">
                  <button
                    className="cancel-btn"
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
          <div className="empty-state">
            <FileText className="empty-icon" size={48} />
            <p className="empty-text">No orders yet. Click "New Order" to create one.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} data-testid="order-modal">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Order</h3>
              <button className="modal-close" onClick={() => setShowModal(false)} data-testid="close-modal-btn">
                <X size={16} />
              </button>
            </div>
            <form className="order-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Asset</label>
                <select
                  className="form-select"
                  value={formData.asset}
                  onChange={(e) => handleInputChange('asset', e.target.value)}
                  data-testid="form-asset"
                >
                  {ASSETS.map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Side</label>
                <div className="side-buttons">
                  <button
                    type="button"
                    className={`side-btn buy ${formData.side === 'buy' ? 'active' : ''}`}
                    onClick={() => handleInputChange('side', 'buy')}
                    data-testid="form-side-buy"
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    className={`side-btn sell ${formData.side === 'sell' ? 'active' : ''}`}
                    onClick={() => handleInputChange('side', 'sell')}
                    data-testid="form-side-sell"
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Order Type</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    data-testid="form-type"
                  >
                    {ORDER_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={formData.qty}
                    onChange={(e) => handleInputChange('qty', e.target.value)}
                    placeholder="0.0000"
                    required
                    data-testid="form-qty"
                  />
                </div>
              </div>

              {formData.type !== 'market' && (
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0.00"
                    required
                    data-testid="form-price"
                  />
                </div>
              )}

              <button type="submit" className="submit-btn" data-testid="submit-order-btn">
                Submit Order
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
