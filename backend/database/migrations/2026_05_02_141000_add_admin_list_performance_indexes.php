<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->index(['is_active', 'name'], 'users_is_active_name_admin_list_index');
        });

        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->index('created_at', 'audit_logs_created_at_index');
            $table->index(['event', 'created_at'], 'audit_logs_event_created_at_index');
            $table->index(['user_id', 'created_at'], 'audit_logs_user_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->dropIndex('audit_logs_user_created_at_index');
            $table->dropIndex('audit_logs_event_created_at_index');
            $table->dropIndex('audit_logs_created_at_index');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_is_active_name_admin_list_index');
        });
    }
};
