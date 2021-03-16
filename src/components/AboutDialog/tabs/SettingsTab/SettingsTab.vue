<template>
    <div>
        <span class="text-h5">Settings</span>
        <q-separator class="q-mb-lg"/>
        <div>
            <!-- -->
        </div>
        <q-page-sticky position="bottom-right" :offset="[10, 10]">
            <q-btn
                no-caps
                rounded
                color="primary"
                icon="mdi-content-save-outline"
                label="Save"
                :disable="!isChanges"
                @click="qBtnSave_onClick"
            />
        </q-page-sticky>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class SettingsTab extends Vue {
    public get isChanges() {
        return false;
    }

    public qBtnSave_onClick() {
        this.$q.notify({
            type: 'positive',
            message: 'Saved the settings.',
            color: 'green',
            timeout: 1000,
            badgeStyle: {
                opacity: 0
            }
        });
    }
}
</script>
