// Simple confirmation dialog for destructive actions like delete
const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Confirm Action</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
