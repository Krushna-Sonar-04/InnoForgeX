class Claim:

    def __init__(
        self,
        patient_id,
        provider_id,
        amount,
        diagnosis,
        procedure_code
    ):

        self.patient_id = patient_id
        self.provider_id = provider_id
        self.amount = amount
        self.diagnosis = diagnosis
        self.procedure_code = procedure_code