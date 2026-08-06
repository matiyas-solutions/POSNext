frappe.ui.form.on('Stock Entry', {
    custom_suppliers: function(frm) {
        toggle_supplier_fields(frm);
    },
    custom_supplier_repair: function(frm) {
        apply_warehouse_to_items(frm);
    },
    custom__supplier: function(frm) {
        apply_warehouse_to_items(frm);
    },
    refresh: function(frm) {
        toggle_supplier_fields(frm);
    }
});

frappe.ui.form.on('Stock Entry Detail', {
    items_add: function(frm, cdt, cdn) {
        apply_warehouse_to_single_row(frm, locals[cdt][cdn]);
    }
});

function toggle_supplier_fields(frm) {
    let show = frm.doc.custom_suppliers ? true : false;

    frm.toggle_display(['custom__supplier', 'custom_supplier_repair'], show);
    frm.toggle_reqd(['custom__supplier', 'custom_supplier_repair'], show);

    if (!show) {
        frm.set_value('custom__supplier', '');
        frm.set_value('custom_supplier_repair', '');
    }

    frm.refresh_fields();
}

function apply_warehouse_to_items(frm) {
    let supplier = frm.doc.custom__supplier;
    let mode = frm.doc.custom_supplier_repair;

    if (!supplier || !mode) {
        clear_all_rows(frm);
        return;
    }

    frappe.db.get_value('Supplier', supplier, 'custom_warehouse').then(r => {
        let wh = r && r.message ? r.message.custom_warehouse : null;

        (frm.doc.items || []).forEach(row => {
            set_row_warehouse(row, wh, mode);
        });
        frm.refresh_field('items');
    });
}

function apply_warehouse_to_single_row(frm, row) {
    let supplier = frm.doc.custom__supplier;
    let mode = frm.doc.custom_supplier_repair;
    if (!supplier || !mode) return;

    frappe.db.get_value('Supplier', supplier, 'custom_warehouse').then(r => {
        let wh = r && r.message ? r.message.custom_warehouse : null;
        set_row_warehouse(row, wh, mode);
        frm.refresh_field('items');
    });
}
function set_row_warehouse(row, wh, mode) {
    if (mode === 'Stock Return') {
        frappe.model.set_value(row.doctype, row.name, 's_warehouse', wh || '');
        frappe.model.set_value(row.doctype, row.name, 't_warehouse', '');
    } else if (mode === 'Stock Reconcilliation') {
        frappe.model.set_value(row.doctype, row.name, 't_warehouse', wh || '');
        frappe.model.set_value(row.doctype, row.name, 's_warehouse', '');
    }
}

function clear_all_rows(frm) {
    (frm.doc.items || []).forEach(row => {
        frappe.model.set_value(row.doctype, row.name, 's_warehouse', '');
        frappe.model.set_value(row.doctype, row.name, 't_warehouse', '');
    });
    frm.refresh_field('items');
}