
import frappe

def reconcile_return_against_original(doc, method):
    if not doc.is_return:
        return
    
    if not doc.return_against:
        return
    
    original = frappe.get_doc(
        "Sales Invoice",
        doc.return_against
    )
    original.set_status(update=True)
    outstanding = original.outstanding_amount or 0

    if outstanding <= 0:
        return
    
    return_amount = abs(doc.grand_total)
    adjust_amount = min(
        outstanding,
        return_amount
    )
    if adjust_amount <= 0:
        return
    
    ple = frappe.get_doc(
        {
            "doctype": "Payment Ledger Entry",
            "company": doc.company,
            "posting_date": doc.posting_date,
            "account": doc.debit_to,
            "party_type": "Customer",
            "party": doc.customer,
            "voucher_type": "Sales Invoice",
            "voucher_no": original.name,
            "against_voucher_type": "Sales Invoice",
            "against_voucher_no": doc.name,
            "amount": -adjust_amount,
            "delinked": 0
        }
    )
    ple.insert(
        ignore_permissions=True
    )
    frappe.db.commit()
    original.reload()
    original.set_status(update=True)